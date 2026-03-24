import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Persistent state
  var nextLetterId = 1;
  let userProfiles = Map.empty<Principal, Profile>();
  let persistentLetters = Map.empty<Nat, Letter>();
  let persistentInboxes = Map.empty<Principal, [Nat]>();
  let persistentOutboxes = Map.empty<Principal, [Nat]>();

  // Type definitions
  type UserId = Principal;
  type LetterId = Nat;

  type UserProfile = {
    name : Text;
    city : Text;
    signature : Text;
  };

  type Profile = UserProfile;

  module Profile {
    public func compare(a : Profile, b : Profile) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  type StampType = {
    #indian;
    #pakistani;
  };

  type LetterStatus = {
    #pending : Time.Time;
    #inTransit : Time.Time;
    #delivered : Time.Time;
  };

  type Letter = {
    from : UserId;
    to : UserId;
    body : Text;
    stamp : StampType;
    status : LetterStatus;
    read : Bool;
    timestamp : Time.Time;
  };

  // Access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Required user profile management functions for frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Query for search by name
  public query ({ caller }) func searchProfilesByName(searchText : Text) : async [Profile] {
    userProfiles.values().toArray().filter(
      func(p) {
        p.name.toLower().contains(#text(searchText.toLower()));
      }
    ).sort();
  };

  // Letters handler
  public shared ({ caller }) func sendLetter(to : Principal, body : Text, stamp : StampType) : async Nat {
    let newLetterId = nextLetterId;
    nextLetterId += 1;

    let letter : Letter = {
      to;
      from = caller;
      body;
      stamp;
      status = #pending(Time.now());
      read = false;
      timestamp = Time.now();
    };

    persistentLetters.add(newLetterId, letter);

    let senderOutbox = switch (persistentOutboxes.get(caller)) {
      case (null) { [] };
      case (?outbox) { outbox };
    };
    persistentOutboxes.add(caller, senderOutbox.concat([newLetterId]));

    let recipientInbox = switch (persistentInboxes.get(to)) {
      case (null) { [] };
      case (?inbox) { inbox };
    };
    persistentInboxes.add(to, recipientInbox.concat([newLetterId]));

    newLetterId;
  };

  // get all sent letter IDs by a user
  public query ({ caller }) func getOutbox({ userId } : { userId : Principal }) : async [LetterId] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own outbox");
    };
    switch (persistentOutboxes.get(userId)) {
      case (null) { [] };
      case (?outbox) { outbox };
    };
  };

  // get all received letter IDs by a user
  public query ({ caller }) func getInbox({ userId } : { userId : Principal }) : async [LetterId] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own inbox");
    };
    switch (persistentInboxes.get(userId)) {
      case (null) { [] };
      case (?inbox) { inbox };
    };
  };
};

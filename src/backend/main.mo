import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  var nextLetterId = 1;
  let userProfiles = Map.empty<Principal, Profile>();
  let persistentLetters = Map.empty<Nat, Letter>();
  let persistentInboxes = Map.empty<Principal, [Nat]>();
  let persistentOutboxes = Map.empty<Principal, [Nat]>();
  let letterSignatures = Map.empty<Nat, Text>();
  let letterReadStatus = Map.empty<Nat, Bool>();
  // Separate map for delivery times to avoid breaking existing Letter stable type
  let letterDeliveryTimes = Map.empty<Nat, Int>();

  // Legacy stable variables (kept for upgrade compatibility)
  var nextCodeSuffix = 0;
  let userCodes = Map.empty<Principal, Text>();
  let codeIndex = Map.empty<Text, Principal>();

  // Username system
  let usernames = Map.empty<Principal, Text>();
  let usernameIndex = Map.empty<Text, Principal>();
  let usernameChangeTimes = Map.empty<Principal, [Int]>();

  // Friend system
  let friendRequests = Map.empty<Principal, [Principal]>(); // incoming requests per user
  let friendsList = Map.empty<Principal, [Principal]>(); // accepted friends per user

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

  // Letter type unchanged from original to preserve stable compatibility
  type Letter = {
    from : UserId;
    to : UserId;
    body : Text;
    stamp : StampType;
    status : LetterStatus;
    read : Bool;
    timestamp : Time.Time;
  };

  type LetterDetail = {
    id : Nat;
    from : Principal;
    to : Principal;
    body : Text;
    stamp : StampType;
    timestamp : Time.Time;
    signed : Bool;
    deliveryTime : Int;
  };

  type UserSearchResult = {
    name : Text;
    city : Text;
    username : Text;
    principal : Principal;
  };

  type SetUsernameResult = {
    #ok;
    #error : Text;
  };

  type FriendEntry = {
    username : Text;
    principal : Principal;
  };

  type FriendRequestResult = {
    #ok;
    #error : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func isValidUsername(username : Text) : Bool {
    let size = username.size();
    if (size < 3 or size > 30) return false;
    var digitCount = 0;
    for (c in username.chars()) {
      let isLetter = (c >= 'a' and c <= 'z') or (c >= 'A' and c <= 'Z');
      let isDigit = c >= '0' and c <= '9';
      let isUnderscore = c == '_';
      if (not (isLetter or isDigit or isUnderscore)) return false;
      if (isDigit) digitCount += 1;
    };
    digitCount >= 2
  };

  public shared ({ caller }) func setUsername(username : Text) : async SetUsernameResult {
    if (not isValidUsername(username)) {
      return #error("invalid");
    };
    let lower = username.toLower();

    switch (usernameIndex.get(lower)) {
      case (?existing) {
        if (existing != caller) {
          return #error("taken");
        };
        return #ok;
      };
      case (null) {};
    };

    let now : Int = Time.now();
    let dayNs : Int = 24 * 60 * 60 * 1_000_000_000;
    let fourteenDaysNs : Int = 14 * dayNs;
    let yearNs : Int = 365 * dayNs;

    switch (usernameChangeTimes.get(caller)) {
      case (?times) {
        if (times.size() > 0) {
          let lastChange = times[times.size() - 1];
          if (now - lastChange < fourteenDaysNs) {
            return #error("too_soon");
          };
        };
        var recentCount = 0;
        var recentTimes : [Int] = [];
        for (t in times.vals()) {
          if (now - t < yearNs) {
            recentCount += 1;
            recentTimes := recentTimes.concat([t]);
          };
        };
        if (recentCount >= 5) {
          return #error("limit_reached");
        };
        switch (usernames.get(caller)) {
          case (?old) { usernameIndex.remove(old); };
          case (null) {};
        };
        usernameChangeTimes.add(caller, recentTimes.concat([now]));
      };
      case (null) {
        usernameChangeTimes.add(caller, [now]);
      };
    };

    usernames.add(caller, lower);
    usernameIndex.add(lower, caller);
    #ok
  };

  public query ({ caller }) func getMyUsername() : async ?Text {
    usernames.get(caller)
  };

  public query func checkUsernameAvailable(username : Text) : async Bool {
    if (not isValidUsername(username)) return false;
    switch (usernameIndex.get(username.toLower())) {
      case (null) { true };
      case (?_) { false };
    }
  };

  public query func findUserByUsername(username : Text) : async ?UserSearchResult {
    let lower = username.toLower();
    switch (usernameIndex.get(lower)) {
      case (null) { null };
      case (?p) {
        switch (userProfiles.get(p)) {
          case (null) {
            ?{ name = lower; city = ""; username = lower; principal = p };
          };
          case (?profile) {
            ?{ name = profile.name; city = profile.city; username = lower; principal = p };
          };
        };
      };
    }
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller)
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user)
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller = _ }) func searchProfilesByName(searchText : Text) : async [Profile] {
    userProfiles.values().toArray().filter(
      func(p) { p.name.toLower().contains(#text(searchText.toLower())) }
    ).sort()
  };

  public shared ({ caller }) func sendLetter(to : Principal, body : Text, stamp : StampType) : async Nat {
    let newLetterId = nextLetterId;
    nextLetterId += 1;

    // Pseudo-random delivery time: 1-120 seconds, stored separately
    let pseudoRandSec : Int = (newLetterId * 37 + Int.abs(Time.now()) % 1000) % 120 + 1;
    let deliveryTime : Int = Time.now() + pseudoRandSec * 1_000_000_000;
    letterDeliveryTimes.add(newLetterId, deliveryTime);

    let letter : Letter = {
      to; from = caller; body; stamp;
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

    newLetterId
  };

  public query ({ caller }) func getLetter(letterId : Nat) : async ?LetterDetail {
    switch (persistentLetters.get(letterId)) {
      case (null) { null };
      case (?letter) {
        if (caller != letter.from and caller != letter.to and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized");
        };
        let signed = switch (letterReadStatus.get(letterId)) {
          case (?v) { v };
          case (null) { false };
        };
        // deliveryTime: use stored value, or 0 for legacy letters (treat as already delivered)
        let deliveryTime = switch (letterDeliveryTimes.get(letterId)) {
          case (?t) { t };
          case (null) { 0 };
        };
        ?{ id = letterId; from = letter.from; to = letter.to; body = letter.body; stamp = letter.stamp; timestamp = letter.timestamp; signed; deliveryTime }
      };
    }
  };

  public shared ({ caller }) func signLetter(letterId : Nat, signatureData : Text) : async Bool {
    switch (persistentLetters.get(letterId)) {
      case (null) { false };
      case (?letter) {
        if (caller != letter.to) {
          Runtime.trap("Only the recipient can sign");
        };
        letterSignatures.add(letterId, signatureData);
        letterReadStatus.add(letterId, true);
        true
      };
    }
  };

  public query ({ caller }) func getLetterSignature(letterId : Nat) : async ?Text {
    switch (persistentLetters.get(letterId)) {
      case (null) { null };
      case (?letter) {
        if (caller != letter.from and caller != letter.to and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized");
        };
        letterSignatures.get(letterId)
      };
    }
  };

  public query ({ caller }) func getOutbox({ userId } : { userId : Principal }) : async [LetterId] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (persistentOutboxes.get(userId)) {
      case (null) { [] };
      case (?outbox) { outbox };
    }
  };

  public query ({ caller }) func getInbox({ userId } : { userId : Principal }) : async [LetterId] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (persistentInboxes.get(userId)) {
      case (null) { [] };
      case (?inbox) { inbox };
    }
  };

  // ---- FRIEND SYSTEM ----

  public shared ({ caller }) func sendFriendRequest(toUsername : Text) : async FriendRequestResult {
    let lower = toUsername.toLower();
    switch (usernameIndex.get(lower)) {
      case (null) { #error("User not found") };
      case (?target) {
        if (target == caller) return #error("Cannot add yourself");
        // Check if already friends
        let myFriends = switch (friendsList.get(caller)) {
          case (null) { [] };
          case (?f) { f };
        };
        for (f in myFriends.vals()) {
          if (f == target) return #error("Already friends");
        };
        // Check if request already sent
        let targetRequests = switch (friendRequests.get(target)) {
          case (null) { [] };
          case (?r) { r };
        };
        for (r in targetRequests.vals()) {
          if (r == caller) return #error("Request already sent");
        };
        friendRequests.add(target, targetRequests.concat([caller]));
        #ok
      };
    }
  };

  public shared ({ caller }) func acceptFriendRequest(fromPrincipal : Principal) : async Bool {
    let myRequests = switch (friendRequests.get(caller)) {
      case (null) { return false };
      case (?r) { r };
    };
    var found = false;
    var newRequests : [Principal] = [];
    for (r in myRequests.vals()) {
      if (r == fromPrincipal) { found := true; }
      else { newRequests := newRequests.concat([r]); };
    };
    if (not found) return false;
    friendRequests.add(caller, newRequests);
    let myFriends = switch (friendsList.get(caller)) {
      case (null) { [] };
      case (?f) { f };
    };
    friendsList.add(caller, myFriends.concat([fromPrincipal]));
    let theirFriends = switch (friendsList.get(fromPrincipal)) {
      case (null) { [] };
      case (?f) { f };
    };
    friendsList.add(fromPrincipal, theirFriends.concat([caller]));
    true
  };

  public shared ({ caller }) func declineFriendRequest(fromPrincipal : Principal) : async Bool {
    let myRequests = switch (friendRequests.get(caller)) {
      case (null) { return false };
      case (?r) { r };
    };
    var found = false;
    var newRequests : [Principal] = [];
    for (r in myRequests.vals()) {
      if (r == fromPrincipal) { found := true; }
      else { newRequests := newRequests.concat([r]); };
    };
    if (not found) return false;
    friendRequests.add(caller, newRequests);
    true
  };

  public shared ({ caller }) func removeFriend(friendPrincipal : Principal) : async Bool {
    let myFriends = switch (friendsList.get(caller)) {
      case (null) { return false };
      case (?f) { f };
    };
    var found = false;
    var newMyFriends : [Principal] = [];
    for (f in myFriends.vals()) {
      if (f == friendPrincipal) { found := true; }
      else { newMyFriends := newMyFriends.concat([f]); };
    };
    if (not found) return false;
    friendsList.add(caller, newMyFriends);
    let theirFriends = switch (friendsList.get(friendPrincipal)) {
      case (null) { [] };
      case (?f) { f };
    };
    var newTheirFriends : [Principal] = [];
    for (f in theirFriends.vals()) {
      if (f != caller) { newTheirFriends := newTheirFriends.concat([f]); };
    };
    friendsList.add(friendPrincipal, newTheirFriends);
    true
  };

  public query ({ caller }) func getFriends() : async [FriendEntry] {
    let myFriends = switch (friendsList.get(caller)) {
      case (null) { [] };
      case (?f) { f };
    };
    var result : [FriendEntry] = [];
    for (p in myFriends.vals()) {
      let uname = switch (usernames.get(p)) {
        case (null) { "unknown" };
        case (?u) { u };
      };
      result := result.concat([{ username = uname; principal = p }]);
    };
    result
  };

  public query ({ caller }) func getPendingFriendRequests() : async [FriendEntry] {
    let pending = switch (friendRequests.get(caller)) {
      case (null) { [] };
      case (?r) { r };
    };
    var result : [FriendEntry] = [];
    for (p in pending.vals()) {
      let uname = switch (usernames.get(p)) {
        case (null) { "unknown" };
        case (?u) { u };
      };
      result := result.concat([{ username = uname; principal = p }]);
    };
    result
  };
};

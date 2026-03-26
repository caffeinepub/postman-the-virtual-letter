import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Copy,
  Loader2,
  Save,
  Share2,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAcceptFriendRequest,
  useCallerProfile,
  useCheckUsername,
  useDeclineFriendRequest,
  useGetFriends,
  useGetPendingFriendRequests,
  useMyUsername,
  useRemoveFriend,
  useSaveProfile,
  useSendFriendRequest,
  useSetUsername,
} from "../hooks/useQueries";

function validateUsername(username: string): boolean {
  if (username.length < 3 || username.length > 30) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
  const digitCount = (username.match(/\d/g) ?? []).length;
  return digitCount >= 2;
}

interface Props {
  defaultAddFriend?: string;
}

export default function ProfilePage({ defaultAddFriend }: Props) {
  const { data: profile, isLoading } = useCallerProfile();
  const { data: currentUsername, isLoading: usernameLoading } = useMyUsername();
  const saveProfile = useSaveProfile();
  const setUsername = useSetUsername();
  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const declineFriendRequest = useDeclineFriendRequest();
  const removeFriend = useRemoveFriend();
  const { data: friends } = useGetFriends();
  const { data: pendingRequests } = useGetPendingFriendRequests();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [signature, setSignature] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [debouncedNewUsername, setDebouncedNewUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);

  const [addFriendInput, setAddFriendInput] = useState(defaultAddFriend ?? "");

  const isNewUsernameValid = validateUsername(newUsername);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isNewUsernameValid) setDebouncedNewUsername(newUsername);
      else setDebouncedNewUsername("");
    }, 400);
    return () => clearTimeout(timer);
  }, [newUsername, isNewUsernameValid]);

  const { data: isAvailable, isFetching: checkingAvailability } =
    useCheckUsername(debouncedNewUsername);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCity(profile.city);
      setSignature(profile.signature);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        city: city.trim(),
        signature: signature.trim(),
      });
      toast.success("Profile saved! ✉");
    } catch {
      toast.error("Failed to save profile.");
    }
  };

  const handleChangeUsername = async () => {
    if (!isNewUsernameValid || isAvailable !== true) return;
    try {
      const result = await setUsername.mutateAsync(newUsername);
      if (result.__kind__ === "ok") {
        toast.success("Username updated! ✉");
        setNewUsername("");
        setUsernameTouched(false);
      } else if (result.__kind__ === "error") {
        if (result.value === "too_soon") {
          toast.error("You can only change your username after 14 days.");
        } else if (result.value === "limit_reached") {
          toast.error(
            "You've reached the limit of 5 username changes per year.",
          );
        } else if (result.value === "taken") {
          toast.error("That username is already taken.");
        } else {
          toast.error("Username doesn't meet requirements.");
        }
      }
    } catch {
      toast.error("Failed to update username.");
    }
  };

  const handleCopyUsername = async () => {
    if (!currentUsername) return;
    try {
      await navigator.clipboard.writeText(`@${currentUsername}`);
      toast.success("Username copied!");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handleShareUsername = async () => {
    if (!currentUsername) return;
    const shareUrl = `${window.location.origin}?addUser=${currentUsername}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "POSTMAN",
          text: "Add me on POSTMAN",
          url: shareUrl,
        });
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied!");
      } catch {
        toast.error("Could not copy link.");
      }
    }
  };

  const handleSendFriendRequest = async () => {
    const username = addFriendInput.trim().replace(/^@/, "");
    if (!username) return;
    try {
      const result = await sendFriendRequest.mutateAsync(username);
      if (result.__kind__ === "ok") {
        toast.success(`Friend request sent to @${username}!`);
        setAddFriendInput("");
      } else {
        toast.error(
          result.value === "not_found" ? "User not found." : result.value,
        );
      }
    } catch {
      toast.error("Failed to send friend request.");
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-20"
        data-ocid="profile.loading_state"
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "oklch(0.42 0.10 48)" }}
        />
      </div>
    );
  }

  const showUsernameAvailability =
    usernameTouched &&
    isNewUsernameValid &&
    debouncedNewUsername === newUsername &&
    !checkingAvailability;
  const canChangeUsername =
    isNewUsernameValid && isAvailable === true && !setUsername.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
      data-ocid="profile.section"
    >
      <div className="text-center">
        <h2
          className="font-playfair text-3xl font-bold"
          style={{ color: "oklch(0.25 0.07 50)" }}
        >
          Your Postal Profile
        </h2>
        <p
          className="font-lora italic text-sm mt-1"
          style={{ color: "oklch(0.50 0.07 55)" }}
        >
          How you appear to other postmasters
        </p>
      </div>

      {/* Username Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        data-ocid="profile.username_card"
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.07 48), oklch(0.30 0.10 42))",
          border: "2px solid oklch(0.55 0.12 50)",
          boxShadow:
            "4px 4px 0 oklch(0.15 0.05 48), inset 0 0 30px oklch(0.10 0.04 48 / 0.3)",
        }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent, transparent 6px, oklch(0.55 0.12 50 / 0.4) 6px, oklch(0.55 0.12 50 / 0.4) 8px)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent, transparent 6px, oklch(0.55 0.12 50 / 0.4) 6px, oklch(0.55 0.12 50 / 0.4) 8px)",
          }}
        />
        <div className="px-8 py-5">
          <p
            className="font-playfair text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "oklch(0.75 0.08 60)" }}
          >
            ✦ Your Username ✦
          </p>
          {usernameLoading ? (
            <div
              className="flex items-center gap-2 mt-1"
              data-ocid="profile.username_loading_state"
            >
              <Loader2
                className="w-4 h-4 animate-spin"
                style={{ color: "oklch(0.80 0.10 72)" }}
              />
              <span
                className="font-lora text-sm"
                style={{ color: "oklch(0.75 0.08 65)" }}
              >
                Loading…
              </span>
            </div>
          ) : (
            <p
              className="font-playfair text-3xl font-bold tracking-wider mt-0.5"
              style={{
                color: "oklch(0.97 0.05 80)",
                textShadow: "0 2px 8px oklch(0.10 0.04 48 / 0.5)",
              }}
              data-ocid="profile.username_display"
            >
              @{currentUsername ?? "—"}
            </p>
          )}
          <p
            className="font-lora italic text-xs mt-2"
            style={{ color: "oklch(0.72 0.07 62)" }}
          >
            Share your username so others can send you letters
          </p>

          {/* Copy & Share buttons */}
          {currentUsername && (
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleCopyUsername}
                data-ocid="profile.copy_username_button"
                className="flex items-center gap-1.5 px-3 py-1.5 font-lora text-xs transition-all hover:brightness-125 active:scale-95"
                style={{
                  border: "1px solid oklch(0.55 0.10 55 / 0.6)",
                  color: "oklch(0.85 0.06 72)",
                  background: "oklch(0.18 0.05 48 / 0.6)",
                }}
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button
                type="button"
                onClick={handleShareUsername}
                data-ocid="profile.share_username_button"
                className="flex items-center gap-1.5 px-3 py-1.5 font-lora text-xs transition-all hover:brightness-125 active:scale-95"
                style={{
                  border: "1px solid oklch(0.55 0.10 55 / 0.6)",
                  color: "oklch(0.85 0.06 72)",
                  background: "oklch(0.18 0.05 48 / 0.6)",
                }}
              >
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>
          )}
        </div>
        <div
          className="px-8 py-1.5 text-center"
          style={{
            background: "oklch(0.18 0.06 48 / 0.5)",
            borderTop: "1px dashed oklch(0.55 0.10 55 / 0.4)",
          }}
        >
          <p
            className="font-lora text-xs"
            style={{ color: "oklch(0.68 0.07 60)" }}
          >
            ✉ Find Me By Username — POSTMAN Network
          </p>
        </div>
      </motion.div>

      {/* Change Username */}
      <div
        className="p-6 vintage-border space-y-4"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.04 85), oklch(0.91 0.05 78))",
        }}
        data-ocid="profile.change_username_section"
      >
        <h3
          className="font-playfair font-bold text-base"
          style={{ color: "oklch(0.30 0.08 50)" }}
        >
          Change Username
        </h3>
        <p
          className="font-lora italic text-xs"
          style={{ color: "oklch(0.52 0.07 56)" }}
        >
          Allowed after 14 days · Max 5 changes per year
        </p>
        <div className="space-y-2">
          <Label
            htmlFor="new-username"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            New Username
          </Label>
          <div className="relative">
            <Input
              id="new-username"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setUsernameTouched(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleChangeUsername();
              }}
              placeholder="e.g. new_handle_42"
              className="rounded-none font-lora bg-transparent pr-10"
              style={{
                borderColor: !usernameTouched
                  ? "oklch(0.65 0.08 58)"
                  : !isNewUsernameValid
                    ? "oklch(0.55 0.18 22)"
                    : isAvailable === false
                      ? "oklch(0.55 0.18 22)"
                      : isAvailable === true
                        ? "oklch(0.50 0.14 145)"
                        : "oklch(0.65 0.08 58)",
                color: "oklch(0.28 0.07 52)",
              }}
              data-ocid="profile.username_input"
              autoComplete="off"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameTouched &&
                isNewUsernameValid &&
                checkingAvailability && (
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    style={{ color: "oklch(0.52 0.07 56)" }}
                  />
                )}
              {showUsernameAvailability && isAvailable === true && (
                <CheckCircle2
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.14 145)" }}
                />
              )}
              {showUsernameAvailability && isAvailable === false && (
                <XCircle
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.18 22)" }}
                />
              )}
            </div>
          </div>
          {usernameTouched && (
            <p className="text-xs font-lora">
              {showUsernameAvailability && isAvailable === false && (
                <span
                  style={{ color: "oklch(0.45 0.18 22)" }}
                  data-ocid="profile.username_error_state"
                >
                  ✗ Username already taken
                </span>
              )}
              {showUsernameAvailability && isAvailable === true && (
                <span
                  style={{ color: "oklch(0.42 0.14 145)" }}
                  data-ocid="profile.username_success_state"
                >
                  ✓ Available!
                </span>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleChangeUsername}
          disabled={!canChangeUsername}
          data-ocid="profile.change_username_button"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 font-lora text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
            color: "oklch(0.97 0.02 80)",
            border: "2px solid oklch(0.55 0.09 52)",
            boxShadow: canChangeUsername
              ? "3px 3px 0 oklch(0.22 0.06 50)"
              : "none",
          }}
        >
          {setUsername.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Updating…
            </>
          ) : (
            <>✏ Update Username</>
          )}
        </button>
      </div>

      {/* Friends Section */}
      <div
        className="p-6 vintage-border space-y-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.04 85), oklch(0.91 0.05 78))",
        }}
        data-ocid="profile.friends_section"
      >
        <h3
          className="font-playfair font-bold text-base"
          style={{ color: "oklch(0.30 0.08 50)" }}
        >
          📮 Postal Friends
        </h3>

        {/* Add Friend */}
        <div className="space-y-2">
          <Label
            htmlFor="add-friend"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Add a Friend
          </Label>
          <div className="flex gap-2">
            <Input
              id="add-friend"
              value={addFriendInput}
              onChange={(e) => setAddFriendInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendFriendRequest();
              }}
              placeholder="@username"
              className="rounded-none font-lora bg-transparent flex-1"
              style={{
                borderColor: "oklch(0.65 0.08 58)",
                color: "oklch(0.28 0.07 52)",
              }}
              data-ocid="profile.add_friend_input"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleSendFriendRequest}
              disabled={sendFriendRequest.isPending || !addFriendInput.trim()}
              data-ocid="profile.send_friend_request_button"
              className="flex items-center gap-1.5 px-4 py-2 font-lora text-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
                color: "oklch(0.97 0.02 80)",
                border: "2px solid oklch(0.55 0.09 52)",
              }}
            >
              {sendFriendRequest.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Send
            </button>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests && pendingRequests.length > 0 && (
          <div className="space-y-2">
            <p
              className="font-playfair font-semibold text-sm"
              style={{ color: "oklch(0.40 0.10 45)" }}
            >
              Pending Requests ({pendingRequests.length})
            </p>
            <div className="space-y-2">
              {pendingRequests.map((req, i) => (
                <div
                  key={req.principal.toString()}
                  data-ocid={`profile.friend_request.item.${i + 1}`}
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    background: "oklch(0.93 0.04 83)",
                    border: "1px solid oklch(0.75 0.06 62 / 0.5)",
                  }}
                >
                  <span
                    className="font-lora text-sm"
                    style={{ color: "oklch(0.30 0.08 50)" }}
                  >
                    @{req.username}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => acceptFriendRequest.mutate(req.principal)}
                      data-ocid={`profile.accept_friend_button.${i + 1}`}
                      className="px-2.5 py-1 font-lora text-xs transition-all hover:brightness-110"
                      style={{
                        background: "oklch(0.48 0.14 145)",
                        color: "white",
                        border: "1px solid oklch(0.40 0.14 145)",
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => declineFriendRequest.mutate(req.principal)}
                      data-ocid={`profile.decline_friend_button.${i + 1}`}
                      className="px-2.5 py-1 font-lora text-xs transition-all hover:brightness-110"
                      style={{
                        background: "oklch(0.50 0.18 22)",
                        color: "white",
                        border: "1px solid oklch(0.42 0.18 22)",
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-2">
          <p
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.40 0.10 45)" }}
          >
            My Friends{" "}
            {friends && friends.length > 0 ? `(${friends.length})` : ""}
          </p>
          {!friends || friends.length === 0 ? (
            <p
              className="font-lora italic text-xs py-3 text-center"
              style={{ color: "oklch(0.58 0.07 58)" }}
              data-ocid="profile.friends_empty_state"
            >
              No friends yet — send a request above!
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend, i) => (
                <div
                  key={friend.principal.toString()}
                  data-ocid={`profile.friends.item.${i + 1}`}
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    background: "oklch(0.93 0.04 83)",
                    border: "1px solid oklch(0.75 0.06 62 / 0.5)",
                  }}
                >
                  <span
                    className="font-lora text-sm"
                    style={{ color: "oklch(0.30 0.08 50)" }}
                  >
                    @{friend.username}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFriend.mutate(friend.principal)}
                    data-ocid={`profile.remove_friend_button.${i + 1}`}
                    className="flex items-center gap-1 px-2.5 py-1 font-lora text-xs transition-all hover:brightness-110"
                    style={{
                      border: "1px solid oklch(0.60 0.08 50 / 0.6)",
                      color: "oklch(0.45 0.08 50)",
                    }}
                  >
                    <UserMinus className="w-3 h-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div
        className="p-8 vintage-border space-y-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.04 85), oklch(0.91 0.05 78))",
        }}
      >
        <div className="space-y-1.5">
          <Label
            htmlFor="profile-name"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Full Name
          </Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ranjit Singh"
            className="rounded-none font-lora bg-transparent"
            style={{
              borderColor: "oklch(0.65 0.08 58)",
              color: "oklch(0.28 0.07 52)",
            }}
            data-ocid="profile.name_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="profile-city"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            City / Town
          </Label>
          <Input
            id="profile-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Lahore, Bombay, Calcutta…"
            className="rounded-none font-lora bg-transparent"
            style={{
              borderColor: "oklch(0.65 0.08 58)",
              color: "oklch(0.28 0.07 52)",
            }}
            data-ocid="profile.city_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="profile-sig"
            className="font-playfair font-semibold text-sm"
            style={{ color: "oklch(0.32 0.08 52)" }}
          >
            Signature
          </Label>
          <Input
            id="profile-sig"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Your sign-off phrase…"
            className="rounded-none font-lora bg-transparent"
            style={{
              borderColor: "oklch(0.65 0.08 58)",
              color: "oklch(0.28 0.07 52)",
            }}
            data-ocid="profile.signature_input"
          />
          {signature && (
            <div
              className="mt-3 px-4 py-3"
              style={{
                borderTop: "1px dashed oklch(0.60 0.09 55 / 0.5)",
                background: "oklch(0.94 0.04 83)",
              }}
            >
              <p
                className="text-xs font-lora mb-1"
                style={{ color: "oklch(0.52 0.07 56)" }}
              >
                Preview:
              </p>
              <p
                className="font-dancing text-2xl"
                style={{ color: "oklch(0.28 0.07 52)" }}
              >
                {signature}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveProfile.isPending}
          data-ocid="profile.save_button"
          className="w-full inline-flex items-center justify-center gap-2 py-3 font-lora text-base transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.42 0.10 48), oklch(0.30 0.08 52))",
            color: "oklch(0.97 0.02 80)",
            border: "2px solid oklch(0.55 0.09 52)",
            boxShadow: "3px 3px 0 oklch(0.22 0.06 50)",
          }}
        >
          {saveProfile.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Profile
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

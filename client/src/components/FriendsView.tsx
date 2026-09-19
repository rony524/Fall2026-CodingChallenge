import type { FriendItem } from "../types";
import "./FriendsView.css";

interface FriendsViewProps {
  friends: FriendItem[];
}

export function FriendsView({ friends }: FriendsViewProps) {
  return (
    <div className="friends-grid">
      {friends.map((friend) => (
        <div key={friend.id} className="friend-card">
          <img className="friend-card-recent" src={friend.recentSrc} alt="" />
          <div className="friend-card-footer">
            <span className="friend-card-avatar">
              {friend.avatarSrc ? (
                <img src={friend.avatarSrc} alt="" />
              ) : (
                friend.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="friend-card-name">{friend.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

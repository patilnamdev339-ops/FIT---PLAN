import type { AvatarId } from "../lib/types";
import { User, Dumbbell, Zap, Flame, HeartPulse, Activity } from "lucide-react";

export interface AvatarOption {
  id: AvatarId;
  label: string;
  gender: "male" | "female";
  iconName: string;
  bg: string;
  accent: string;
  ring: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: "male_athlete",
    label: "Male Athlete",
    gender: "male",
    iconName: "Zap",
    bg: "#064e3b",
    accent: "#34d399",
    ring: "#10b981",
  },
  {
    id: "male_lifter",
    label: "Male Powerlifter",
    gender: "male",
    iconName: "Dumbbell",
    bg: "#1e293b",
    accent: "#38bdf8",
    ring: "#0ea5e9",
  },
  {
    id: "male_runner",
    label: "Male Sprinter",
    gender: "male",
    iconName: "Flame",
    bg: "#3b1e08",
    accent: "#fb923c",
    ring: "#f97316",
  },
  {
    id: "male_yogi",
    label: "Male Mobility",
    gender: "male",
    iconName: "HeartPulse",
    bg: "#2e1065",
    accent: "#c084fc",
    ring: "#a855f7",
  },
  {
    id: "female_athlete",
    label: "Female Athlete",
    gender: "female",
    iconName: "Zap",
    bg: "#064e3b",
    accent: "#34d399",
    ring: "#10b981",
  },
  {
    id: "female_lifter",
    label: "Female Strength",
    gender: "female",
    iconName: "Dumbbell",
    bg: "#1e293b",
    accent: "#38bdf8",
    ring: "#0ea5e9",
  },
  {
    id: "female_runner",
    label: "Female Endurance",
    gender: "female",
    iconName: "Flame",
    bg: "#3b1e08",
    accent: "#fb923c",
    ring: "#f97316",
  },
  {
    id: "female_yogi",
    label: "Female Yoga & Core",
    gender: "female",
    iconName: "HeartPulse",
    bg: "#2e1065",
    accent: "#c084fc",
    ring: "#a855f7",
  },
];

function renderAvatarIcon(iconName: string, sizeClass: string) {
  switch (iconName) {
    case "Dumbbell":
      return <Dumbbell className={sizeClass} />;
    case "Flame":
      return <Flame className={sizeClass} />;
    case "HeartPulse":
      return <HeartPulse className={sizeClass} />;
    case "Zap":
      return <Zap className={sizeClass} />;
    default:
      return <Activity className={sizeClass} />;
  }
}

export function UserAvatar({
  avatarId,
  name,
  size = "md",
}: {
  avatarId?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const found = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  const sizeClasses =
    size === "sm"
      ? "w-8 h-8 text-xs"
      : size === "lg"
        ? "w-16 h-16 text-lg"
        : "w-10 h-10 text-sm";

  const iconSizeClass =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-5 h-5";

  return (
    <div
      className={`${sizeClasses} rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-md border select-none transition-transform hover:scale-105`}
      style={{
        backgroundColor: found?.bg ?? "#1e293b",
        color: found?.accent ?? "#10b981",
        borderColor: found?.ring ? `${found.ring}55` : "#334155",
      }}
      title={found?.label ?? name}
    >
      {found ? (
        renderAvatarIcon(found.iconName, iconSizeClass)
      ) : (
        <User className={iconSizeClass} />
      )}
    </div>
  );
}

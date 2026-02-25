import { useState } from "react";
import { useState } from "react";
import { useProfile } from "../context/ProfileContext";
import { ProfileEditModal } from "./ProfileEditModal";
import { Edit3, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { ScreenHeader, SCREEN_ANIMATIONS } from "./ui/ScreenHeader";

export function ProfileScreen() {
  const { profile, loading } = useProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>
        <ScreenHeader label="Profile" title="My Profile" />
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="p-8 rounded-3xl bg-white border border-gray-100 animate-pulse">
              <div className="flex gap-8 items-center">
                <div className="w-28 h-28 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-gray-200 rounded-lg w-64" />
                  <div className="h-5 bg-gray-200 rounded-lg w-40" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-24" />
                    <div className="h-6 bg-gray-200 rounded-full w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>
      <ScreenHeader
        label="Profile"
        title={profile.fullName || "My Profile"}
        actions={
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-md active:scale-95"
            style={{ background: "#111827", color: "white" }}
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header Card */}
          <div
            className="p-8 rounded-3xl border opacity-0"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderColor: "rgba(255,255,255,0.4)",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
              animation: "fadeInUp 0.8s ease-out 0.1s forwards"
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg"
                  style={{ background: "#E5E7EB" }}
                >
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-3xl font-bold"
                      style={{ background: "#111827", color: "white", fontFamily: "'Playfair Display', serif" }}
                    >
                      {(profile.fullName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <div>
                  <h2
                    className="text-4xl font-medium italic"
                    style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                  >
                    {profile.fullName || "Your Name"}
                  </h2>
                  <p className="mt-1 text-base" style={{ color: "#6B7280" }}>
                    {profile.professionalTitle || "No title set"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
                    style={{ background: "#F0FDF4", color: "#166534", borderColor: "#BBF7D0" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                    Pro Member
                  </span>
                  {profile.email && (
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "#6B7280" }}>
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </div>
                  )}
                  {profile.phoneNumber && (
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "#6B7280" }}>
                      <Phone className="w-4 h-4" />
                      {profile.phoneNumber}
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: "#6B7280" }}>
                      <MapPin className="w-4 h-4" />
                      {profile.website}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: "#6B7280" }}>
                    <Calendar className="w-4 h-4" />
                    Member since 2024
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div
              className="md:col-span-2 p-8 rounded-3xl border opacity-0"
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                borderColor: "rgba(255,255,255,0.4)",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                animation: "fadeInUp 0.8s ease-out 0.2s forwards"
              }}
            >
              <h3
                className="text-xl italic font-medium mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                About
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                {profile.bio || "No bio added yet. Click Edit Profile to tell your story."}
              </p>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mt-6">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "#9CA3AF" }}
                  >
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-medium border"
                        style={{
                          background: "rgba(255,255,255,0.7)",
                          borderColor: "rgba(0,0,0,0.08)",
                          color: "#374151",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preferences sidebar */}
            <div className="space-y-6">
              <div
                className="p-6 rounded-3xl border opacity-0"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  borderColor: "rgba(255,255,255,0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
                  animation: "fadeInUp 0.8s ease-out 0.3s forwards"
                }}
              >
                <h3
                  className="text-sm font-bold uppercase tracking-widest mb-4"
                  style={{ color: "#9CA3AF" }}
                >
                  Preferences
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Deep Work Mode", value: profile.deepWorkMode ? "Enabled" : "Disabled", on: profile.deepWorkMode },
                    { label: "Quiet Mode",     value: profile.quietMode     ? "Enabled" : "Disabled", on: profile.quietMode },
                    { label: "Weekly Digest",  value: profile.weeklyDigest  ? "Enabled" : "Disabled", on: profile.weeklyDigest },
                  ].map((pref, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                      style={{ borderColor: "rgba(0,0,0,0.05)" }}
                    >
                      <span className="text-xs" style={{ color: "#6B7280" }}>{pref.label}</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: pref.on ? "#059669" : "#9CA3AF" }}
                      >
                        {pref.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="h-12" />
        </div>
      </div>

      <style>{SCREEN_ANIMATIONS}</style>

      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
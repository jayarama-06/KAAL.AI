import { 
  Bell, 
  Palette, 
  ChevronRight,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { toast } from "sonner@2.0.3";
import { useNavigate } from "react-router";
import { ScreenHeader, SCREEN_ANIMATIONS } from "./ui/ScreenHeader";
import { NudgePreferences } from "./NudgePreferences";
import { SentryErrorTestButton } from "./SentryErrorTestButton";

interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function SettingsScreen() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const navigate = useNavigate();
  
  const notifications: ToggleSetting[] = [
    { id: "push", label: "Push Notifications", description: "Real-time alerts on desktop", enabled: settings.pushNotifications },
    { id: "email", label: "Email Digest", description: "Daily summary at 9:00 AM", enabled: settings.emailDigest },
    { id: "sound", label: "Sound Effects", description: "Subtle audio feedback", enabled: settings.soundEffects },
  ];

  const appearance: ToggleSetting[] = [
    { id: "glass", label: "Glassmorphism", description: "Enable blur effects", enabled: settings.glassmorphism },
    { id: "dark", label: "Dark Mode", description: "Switch to dark theme", enabled: settings.darkMode },
    { id: "compact", label: "Compact View", description: "Denser information layout", enabled: settings.compactView },
  ];

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      toast.success("Signed out successfully");
      // Add sign out logic here
    }
  };

  const toggleNotification = (id: string) => {
    const settingsMap: { [key: string]: keyof typeof settings } = {
      push: 'pushNotifications',
      email: 'emailDigest',
      sound: 'soundEffects'
    };
    
    const key = settingsMap[id];
    if (key) {
      updateSettings({ [key]: !settings[key] });
      toast.success(`${notifications.find(n => n.id === id)?.label} ${!settings[key] ? 'enabled' : 'disabled'}`);
    }
  };

  const toggleAppearance = (id: string) => {
    const settingsMap: { [key: string]: keyof typeof settings } = {
      glass: 'glassmorphism',
      dark: 'darkMode',
      compact: 'compactView'
    };
    
    const key = settingsMap[id];
    if (key) {
      updateSettings({ [key]: !settings[key] });
      toast.success(`${appearance.find(a => a.id === id)?.label} ${!settings[key] ? 'enabled' : 'disabled'}`);
    }
  };
  
  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings();
      toast.success('Settings reset to defaults');
    }
  };
  
  const handleSaveChanges = () => {
    toast.success('Settings saved successfully!');
  };
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ backgroundColor: "#F8F9FA" }}>
      <ScreenHeader
        label="Settings"
        title="Preferences"
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:shadow-sm"
              style={{ background: "rgba(255,255,255,0.5)", borderColor: "rgba(0,0,0,0.08)", color: "#6B7280" }}
            >
              Reset
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-md active:scale-95"
              style={{ background: "#111827", color: "white" }}
            >
              Save Changes
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-10 pb-24">
          {/* Title Section */}
          <div
            style={{ animation: "fadeInUp 0.7s ease-out forwards", opacity: 0 }}
          >
            <h2
              className="text-4xl font-medium italic"
              style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
            >
              Settings & <span className="italic">Controls</span>
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#9CA3AF" }}>
              Customize your workspace environment and AI interactions.
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Notifications */}
            <SettingsCard 
              icon={<Bell className="w-7 h-7" />}
              title="Notifications"
              description="Manage how you receive alerts."
              className="col-span-12 lg:col-span-6"
              delay="0.3s"
            >
              <div className="space-y-6">
                {notifications.map((setting) => (
                  <ToggleRow
                    key={setting.id}
                    label={setting.label}
                    description={setting.description}
                    enabled={setting.enabled}
                    onToggle={() => toggleNotification(setting.id)}
                  />
                ))}
              </div>
            </SettingsCard>

            {/* Appearance */}
            <SettingsCard 
              icon={<Palette className="w-7 h-7" />}
              title="Appearance"
              description="Customize the visual interface."
              className="col-span-12 lg:col-span-6"
              delay="0.4s"
            >
              <div className="space-y-6">
                {appearance.map((setting) => (
                  <ToggleRow
                    key={setting.id}
                    label={setting.label}
                    description={setting.description}
                    enabled={setting.enabled}
                    onToggle={() => toggleAppearance(setting.id)}
                  />
                ))}
              </div>
            </SettingsCard>

            {/* Account */}
            <SettingsCard 
              icon={<Bell className="w-7 h-7" />}
              title="Account"
              description="Profile and account management"
              className="col-span-12"
              delay="0.5s"
            >
              <div className="space-y-4">
                <button 
                  className="w-full flex items-center justify-between p-4 rounded-2xl border transition-colors group text-left"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.5)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
                  }}
                  onClick={() => navigate('/profile')}
                >
                  <span className="font-medium" style={{ color: "#111827" }}>Edit Profile</span>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="pt-4 border-t" style={{ borderColor: "rgba(229, 231, 235, 0.5)" }}>
                  <button 
                    className="w-full text-center text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </SettingsCard>

            {/* Nudge Preferences */}
            <SettingsCard 
              icon={<Bell className="w-7 h-7" />}
              title="Nudge Preferences"
              description="Customize nudge settings"
              className="col-span-12"
              delay="0.6s"
            >
              <NudgePreferences />
            </SettingsCard>

            {/* Sentry Error Test Button */}
            <SettingsCard 
              icon={<Bell className="w-7 h-7" />}
              title="Sentry Error Test"
              description="Test Sentry error reporting"
              className="col-span-12"
              delay="0.7s"
            >
              <SentryErrorTestButton />
            </SettingsCard>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{SCREEN_ANIMATIONS}</style>
    </div>
  );
}

interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  delay?: string;
  headerAction?: React.ReactNode;
}

function SettingsCard({ icon, title, description, children, className = "", delay = "0s", headerAction }: SettingsCardProps) {
  return (
    <div 
      className={`rounded-3xl p-8 border transition-all duration-500 opacity-0 ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderColor: "rgba(255, 255, 255, 0.6)",
        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
        animation: `fadeInUp 0.8s ease-out ${delay} forwards`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.01)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)";
      }}
    >
      <div className={`flex items-center mb-8 ${headerAction ? "justify-between" : "gap-4"}`}>
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center"
            style={{ color: "#111827" }}
          >
            {icon}
          </div>
          <div>
            <h3 
              className="text-xl font-medium"
              style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
            >
              {title}
            </h3>
            <p className="text-sm" style={{ color: "#6B7280" }}>{description}</p>
          </div>
        </div>
        {headerAction}
      </div>
      {children}
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, description, enabled, onToggle }: ToggleRowProps) {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-2xl border transition-colors"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        borderColor: "rgba(255, 255, 255, 0.5)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
      }}
    >
      <div className="flex flex-col">
        <span className="font-medium" style={{ color: "#111827" }}>{label}</span>
        <span className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{description}</span>
      </div>
      
      <ToggleSwitch enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

function ToggleSwitch({ enabled, onToggle }: ToggleSwitchProps) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-block w-11 h-6 cursor-pointer"
      role="switch"
      aria-checked={enabled}
    >
      <div 
        className="absolute top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-400"
        style={{
          backgroundColor: enabled ? "#111827" : "#E5E7EB",
          boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"
        }}
      />
      <div 
        className="absolute h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-transform duration-400"
        style={{
          transform: enabled ? "translateX(20px)" : "translateX(0)",
          boxShadow: "0 2px 4px 0 rgba(0,0,0,0.2)"
        }}
      />
    </button>
  );
}
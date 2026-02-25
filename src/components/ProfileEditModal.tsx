import { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Edit2, 
  Link as LinkIcon, 
  Mail, 
  X, 
  Save,
  Shield,
  Award,
  Brain,
  Share2,
  CheckCircle,
  Circle
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { toast } from "sonner@2.0.3";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { profile, updateProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    professionalTitle: profile.professionalTitle,
    pronouns: profile.pronouns,
    dateOfBirth: profile.dateOfBirth,
    dobPrivate: profile.dobPrivate,
    phoneNumber: profile.phoneNumber,
    website: profile.website,
    bio: profile.bio,
    profileImage: profile.profileImage,
    skills: [...profile.skills],
    interests: [...profile.interests],
    deepWorkMode: profile.deepWorkMode,
    quietMode: profile.quietMode,
    weeklyDigest: profile.weeklyDigest,
  });

  const [newSkill, setNewSkill] = useState("");

  // Update form when profile changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: profile.fullName,
        professionalTitle: profile.professionalTitle,
        pronouns: profile.pronouns,
        dateOfBirth: profile.dateOfBirth,
        dobPrivate: profile.dobPrivate,
        phoneNumber: profile.phoneNumber,
        website: profile.website,
        bio: profile.bio,
        profileImage: profile.profileImage,
        skills: [...profile.skills],
        interests: [...profile.interests],
        deepWorkMode: profile.deepWorkMode,
        quietMode: profile.quietMode,
        weeklyDigest: profile.weeklyDigest,
      });
    }
  }, [isOpen, profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const addSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && newSkill.trim()) {
      e.preventDefault();
      setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('💾 ProfileEditModal - handleSave called, formData:', {
        fullName: formData.fullName,
        bio: formData.bio,
        skills: formData.skills,
        interests: formData.interests
      });
      
      await updateProfile({
        fullName: formData.fullName,
        professionalTitle: formData.professionalTitle,
        pronouns: formData.pronouns,
        dateOfBirth: formData.dateOfBirth,
        dobPrivate: formData.dobPrivate,
        phoneNumber: formData.phoneNumber,
        website: formData.website,
        bio: formData.bio,
        profileImage: formData.profileImage,
        skills: formData.skills,
        interests: formData.interests,
        deepWorkMode: formData.deepWorkMode,
        quietMode: formData.quietMode,
        weeklyDigest: formData.weeklyDigest,
      });
      
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Error toast is already shown by the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    toast.info("Changes discarded");
    onClose();
  };

  const interests = [
    "Machine Learning",
    "Sustainability",
    "System Design",
    "Typography",
    "Accessibility",
    "Web3"
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
        style={{ backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-8">
        <div 
          className="relative w-full max-w-6xl my-8 rounded-3xl border shadow-2xl animate-scale-in"
          style={{
            background: "#F8F9FA",
            borderColor: "rgba(255, 255, 255, 0.6)",
            maxHeight: "calc(100vh - 4rem)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div 
            className="sticky top-0 z-20 border-b flex items-center justify-between px-8 py-6 rounded-t-3xl"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderColor: "rgba(255, 255, 255, 0.5)",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
            }}
          >
            <div className="flex flex-col">
              <h1 
                className="text-sm font-semibold tracking-wide uppercase"
                style={{ color: "#6B7280" }}
              >
                Account Settings
              </h1>
              <p 
                className="text-2xl italic"
                style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
              >
                Edit Profile
              </p>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-full transition-all hover:bg-gray-100"
              style={{ color: "#6B7280" }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(100vh - 12rem)" }}>
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Profile Header Card */}
              <div 
                className="p-8 rounded-3xl border opacity-0"
                style={{
                  background: "rgba(255, 255, 255, 0.55)",
                  backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  borderColor: "rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                  animation: "fadeInUp 0.8s ease-out 0.1s forwards"
                }}
              >
                <div className="flex flex-col md:flex-row items-center gap-10">
                  {/* Profile Photo */}
                  <div className="relative group cursor-pointer">
                    <div 
                      className="w-32 h-32 rounded-full p-1 border shadow-lg relative overflow-hidden"
                      style={{
                        borderColor: "rgba(255, 255, 255, 0.5)",
                        backgroundColor: "white",
                        boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      <img 
                        src={formData.profileImage} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                        <Camera className="text-white w-8 h-8" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 w-8 h-8 bg-[#111827] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h2 
                      className="text-4xl font-medium tracking-tight leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                    >
                      {formData.fullName}
                    </h2>
                    <p className="font-light tracking-wide text-lg" style={{ color: "#6B7280" }}>
                      {formData.professionalTitle || 'No title set'}
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                        Pro Member
                      </span>
                      <span className="text-xs font-mono" style={{ color: "rgba(107, 114, 128, 0.7)" }}>
                        ID: K-8829-X
                      </span>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div className="hidden md:block pr-4">
                    <div className="w-20 h-20 relative">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path 
                          className="text-gray-100" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        />
                        <path 
                          className="text-[#111827]" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeDasharray="85, 100" 
                          strokeWidth="2.5"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: "#111827" }}>
                        85%
                      </div>
                    </div>
                    <div className="text-center text-[10px] uppercase tracking-widest mt-1" style={{ color: "#6B7280" }}>
                      Profile
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column - Main Info */}
                <div className="md:col-span-8 flex flex-col gap-8">
                  {/* Identity & Contact */}
                  <div 
                    className="p-8 rounded-3xl border flex flex-col gap-6 opacity-0"
                    style={{
                      background: "rgba(255, 255, 255, 0.55)",
                      backdropFilter: "blur(24px) saturate(180%)",
                      WebkitBackdropFilter: "blur(24px) saturate(180%)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                      animation: "fadeInUp 0.8s ease-out 0.2s forwards"
                    }}
                  >
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <Shield className="w-5 h-5" style={{ color: "#6B7280" }} />
                      <h3 
                        className="text-lg italic font-medium"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                      >
                        Identity &amp; Contact
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Full Name
                        </label>
                        <input 
                          type="text" 
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 transition-all placeholder-gray-400"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            color: "#111827",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Professional Title
                        </label>
                        <input 
                          type="text" 
                          value={formData.professionalTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, professionalTitle: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 transition-all placeholder-gray-400"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            color: "#111827",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Pronouns
                        </label>
                        <select 
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 transition-all appearance-none"
                          value={formData.pronouns}
                          onChange={(e) => setFormData(prev => ({ ...prev, pronouns: e.target.value }))}
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            color: "#111827",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                          }}
                        >
                          <option>He/Him</option>
                          <option>She/Her</option>
                          <option>They/Them</option>
                          <option>Prefer not to say</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center pl-1">
                          <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "#6B7280" }}>
                            Date of Birth
                          </label>
                          <div className="flex items-center gap-1.5 cursor-pointer group">
                            <span className="text-[10px] font-bold group-hover:text-[#111827] transition-colors" style={{ color: "#6B7280" }}>
                              PRIVATE
                            </span>
                            <label className="flex items-center cursor-pointer relative">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={formData.dobPrivate}
                                onChange={() => setFormData(prev => ({ ...prev, dobPrivate: !prev.dobPrivate }))}
                              />
                              <div className="w-7 h-2.5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[-3px] after:left-[-2px] after:bg-white after:border-gray-200 after:border-2 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111827] shadow-sm"></div>
                            </label>
                          </div>
                        </div>
                        <input 
                          type="date" 
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 transition-all"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            color: "#111827",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Phone Number
                        </label>
                        <input 
                          type="tel" 
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="+1 (555) 000-0000"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 transition-all placeholder-gray-400"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            color: "#111827",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Personal Website / Portfolio
                        </label>
                        <div className="relative">
                          <LinkIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                          <input 
                            type="url" 
                            value={formData.website}
                            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://yourportfolio.com"
                            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 transition-all placeholder-gray-400"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.5)",
                              color: "#111827",
                              boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Bio
                        </label>
                        <textarea 
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 transition-all placeholder-gray-400 h-24 resize-none"
                          value={formData.bio}
                          onChange={(e) => {
                            console.log('✏️ Bio textarea onChange - new value:', e.target.value);
                            setFormData(prev => ({ ...prev, bio: e.target.value }));
                          }}
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            color: "#111827",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                          }}
                          placeholder="Brief description for your profile..."
                        />
                        <div className="flex justify-between px-1">
                          <span className="text-[10px]" style={{ color: "#6B7280" }}>Markdown supported</span>
                          <span className="text-[10px]" style={{ color: "#6B7280" }}>{formData.bio.length}/500 chars</span>
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                          <input 
                            type="email" 
                            value={profile.email}
                            readOnly
                            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 cursor-not-allowed"
                            style={{
                              backgroundColor: "rgba(249, 250, 251, 0.5)",
                              color: "#6B7280",
                              boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                            }}
                          />
                          <span className="absolute right-4 top-3.5 text-xs text-green-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Expertise */}
                  <div 
                    className="p-8 rounded-3xl border flex flex-col gap-6 opacity-0"
                    style={{
                      background: "rgba(255, 255, 255, 0.55)",
                      backdropFilter: "blur(24px) saturate(180%)",
                      WebkitBackdropFilter: "blur(24px) saturate(180%)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                      animation: "fadeInUp 0.8s ease-out 0.25s forwards"
                    }}
                  >
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <Award className="w-5 h-5" style={{ color: "#6B7280" }} />
                      <h3 
                        className="text-lg italic font-medium"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                      >
                        Skills &amp; Expertise
                      </h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Core Skills
                        </label>
                        <div 
                          className="w-full border border-gray-200 rounded-xl p-2 min-h-[50px] flex flex-wrap gap-2"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.5)",
                            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
                          }}
                        >
                          {formData.skills.map((skill, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-white text-xs font-medium rounded-lg"
                              style={{ backgroundColor: "#111827" }}
                            >
                              {skill}
                              <button 
                                onClick={() => removeSkill(skill)}
                                className="hover:text-gray-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                          <input 
                            type="text" 
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={addSkill}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 placeholder-gray-400 min-w-[120px]"
                            placeholder="Add skill..."
                          />
                        </div>
                        <p className="text-[10px] pl-1 italic" style={{ color: "#6B7280" }}>
                          Press enter or comma to add a skill
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: "#6B7280" }}>
                          Areas of Interest
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {interests.map((interest) => {
                            const isSelected = formData.interests.includes(interest);
                            return (
                              <button
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                                style={{
                                  borderColor: isSelected ? "#111827" : "#E5E7EB",
                                  backgroundColor: isSelected ? "rgba(17, 24, 39, 0.05)" : "rgba(255, 255, 255, 0.4)",
                                  color: isSelected ? "#111827" : "#6B7280"
                                }}
                              >
                                {isSelected ? (
                                  <CheckCircle className="w-4 h-4" fill="currentColor" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Preferences & Social */}
                <div className="md:col-span-4 flex flex-col gap-8">
                  {/* Focus Preferences */}
                  <div 
                    className="p-8 rounded-3xl border flex flex-col gap-6 opacity-0"
                    style={{
                      background: "rgba(255, 255, 255, 0.55)",
                      backdropFilter: "blur(24px) saturate(180%)",
                      WebkitBackdropFilter: "blur(24px) saturate(180%)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                      animation: "fadeInUp 0.8s ease-out 0.3s forwards"
                    }}
                  >
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <Brain className="w-5 h-5" style={{ color: "#6B7280" }} />
                      <h3 
                        className="text-lg italic font-medium"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                      >
                        Focus Preferences
                      </h3>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between group">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm group-hover:text-black transition-colors" style={{ color: "#111827" }}>
                            Deep Work Mode
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                            Pause notifications
                          </span>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.deepWorkMode}
                            onChange={() => setFormData(prev => ({ ...prev, deepWorkMode: !prev.deepWorkMode }))}
                          />
                          <div className="w-12 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[-4px] after:left-[-2px] after:bg-white after:border-gray-200 after:border-4 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#111827] shadow-sm"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm group-hover:text-black transition-colors" style={{ color: "#111827" }}>
                            Quiet Mode
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                            Hide online status
                          </span>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.quietMode}
                            onChange={() => setFormData(prev => ({ ...prev, quietMode: !prev.quietMode }))}
                          />
                          <div className="w-12 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[-4px] after:left-[-2px] after:bg-white after:border-gray-200 after:border-4 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#111827] shadow-sm"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm group-hover:text-black transition-colors" style={{ color: "#111827" }}>
                            Weekly Digest
                          </span>
                          <span className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                            Email summary
                          </span>
                        </div>
                        <label className="flex items-center cursor-pointer relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData.weeklyDigest}
                            onChange={() => setFormData(prev => ({ ...prev, weeklyDigest: !prev.weeklyDigest }))}
                          />
                          <div className="w-12 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[-4px] after:left-[-2px] after:bg-white after:border-gray-200 after:border-4 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#111827] shadow-sm"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Social Identity */}
                  <div 
                    className="p-8 rounded-3xl border flex flex-col gap-6 opacity-0"
                    style={{
                      background: "rgba(255, 255, 255, 0.55)",
                      backdropFilter: "blur(24px) saturate(180%)",
                      WebkitBackdropFilter: "blur(24px) saturate(180%)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.4)",
                      animation: "fadeInUp 0.8s ease-out 0.4s forwards"
                    }}
                  >
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <Share2 className="w-5 h-5" style={{ color: "#6B7280" }} />
                      <h3 
                        className="text-lg italic font-medium"
                        style={{ fontFamily: "'Playfair Display', serif", color: "#111827" }}
                      >
                        Social Identity
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <button className="w-full group flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-md"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "white"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)"}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#24292e] flex items-center justify-center text-white">
                            <span className="font-mono font-bold text-xs">Gh</span>
                          </div>
                          <span className="text-sm font-medium text-gray-600 group-hover:text-[#111827]">GitHub</span>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                          Linked
                        </span>
                      </button>

                      <button className="w-full group flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-md"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "white"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.4)"}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0077b5] flex items-center justify-center text-white">
                            <span className="font-serif font-bold italic text-xs">in</span>
                          </div>
                          <span className="text-sm font-medium text-gray-600 group-hover:text-[#111827]">LinkedIn</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
                          Connect
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div 
                className="flex justify-end gap-4 pt-8 pb-10 opacity-0"
                style={{ animation: "fadeInUp 0.8s ease-out 0.5s forwards" }}
              >
                <button 
                  onClick={handleDiscard}
                  className="px-8 py-3 rounded-xl font-medium transition-colors"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#111827";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#6B7280";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-white px-10 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#111827",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)";
                  }}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
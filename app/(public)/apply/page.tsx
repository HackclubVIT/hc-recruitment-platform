"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Department {
  id: number;
  name: string;
  slug: string;
}

interface FormData {
  name: string;
  registerNumber: string;
  email: string;
  phoneNumber: string;
  firstPreference: string;
  secondPreference: string;
  firstPrefReason: string;
  secondPrefReason: string;
  yearOfStudy: string;
  github: string;
  linkedin: string;
  projectDetails: string;
  skillToLearn: string;
  whyHackclub: string;
  productiveWebsiteQuestions: string;
  departmentId: number;
}

const initialFormData: FormData = {
  name: "",
  registerNumber: "",
  email: "",
  phoneNumber: "",
  firstPreference: "",
  secondPreference: "",
  firstPrefReason: "",
  secondPrefReason: "",
  yearOfStudy: "1st",
  github: "",
  linkedin: "",
  projectDetails: "",
  skillToLearn: "",
  whyHackclub: "",
  productiveWebsiteQuestions: "",
  departmentId: 0,
};

export default function ApplyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);

  const validateEmail = (email: string) => {
    const regex = /^[^@]+@vitstudent\.ac\.in$/;
    return regex.test(email);
  };

  const validateRegNo = (reg: string) => {
    const regex = /^[0-9]{2}[a-zA-Z]{3}[0-9]{4}$/;
    return regex.test(reg);
  };

  useEffect(() => {
    fetch("/api/public/apply")
      .then((res) => res.json())
      .then((data) => {
        if (data.departments) {
          setDepartments(data.departments);
          if (data.departments.length > 0) {
            setFormData((prev) => ({ ...prev, departmentId: data.departments[0].id }));
          }
        }
      })
      .catch(() => setError("Failed to load departments"));
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const triggerError = (msg: string) => {
      setError(msg);
      setTimeout(() => {
        const errEl = document.getElementById("apply-error-banner");
        if (errEl) errEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    };

    if (!formData.name.trim() || !formData.registerNumber.trim() || !formData.email.trim() || !formData.firstPrefReason.trim()) {
      triggerError("Please fill in all required fields marked with *.");
      return;
    }

    if (formData.secondPreference && formData.secondPreference !== "None" && formData.secondPreference === formData.firstPreference) {
      triggerError("Your 1st and 2nd preferences must be different departments.");
      return;
    }

    if (formData.secondPreference && formData.secondPreference !== "None" && !formData.secondPrefReason.trim()) {
      triggerError("Please provide a reason for your 2nd preference department.");
      return;
    }

    if (!formData.skillToLearn.trim()) {
      triggerError('Please answer: "What is the one technical/design skill you want to learn through HackClub? Why?"');
      return;
    }

    if (!formData.whyHackclub.trim()) {
      triggerError('Please answer: "Why HackClub?"');
      return;
    }

    if (!formData.productiveWebsiteQuestions.trim()) {
      triggerError("Please answer the question about building a student productivity website.");
      return;
    }

    const emailTrimmed = formData.email.trim().toLowerCase();
    const regTrimmed = formData.registerNumber.trim().toUpperCase();

    if (!validateEmail(emailTrimmed)) {
      triggerError("Enter a valid student email in format name.year@vitstudent.ac.in or name.lastnameyear@vitstudent.ac.in");
      return;
    }

    if (!validateRegNo(regTrimmed)) {
      triggerError("Enter a valid VIT register number (e.g., 24BCE1234)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: emailTrimmed,
          registerNumber: regTrimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess(true);
      setSubmittedData(formData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit application. You may have already applied.";
      triggerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success && submittedData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
        <div className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95">
          <div className="bg-gray-900/50 border border-red-900/30 rounded-xl p-8 backdrop-blur-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 text-green-400 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-4">Application Submitted!</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Thank you for applying to <strong className="text-white">HackClub VIT Chennai</strong>. Your application for{" "}
              <strong className="text-red-400">{submittedData.firstPreference}</strong> (1st Preference)
              {submittedData.secondPreference && submittedData.secondPreference !== "None" && (
                <> and <strong className="text-red-400">{submittedData.secondPreference}</strong> (2nd Preference)</>
              )} has been received.
            </p>

            <div className="bg-gray-900/30 border border-red-900/20 rounded-lg p-6 text-left mb-8 font-mono text-sm">
              <p className="text-red-400 font-bold mb-4">$ cat next-steps.sh</p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex gap-2"><span className="text-green-400">[1]</span> Screening: We will review your department preferences and application.</li>
                <li className="flex gap-2"><span className="text-green-400">[2]</span> Update: Keep an eye on your student email ({submittedData.email.toLowerCase()}) for interview invites.</li>
                <li className="flex gap-2"><span className="text-green-400">[3]</span> Community: Keep building!</li>
              </ul>
            </div>

            <button
              onClick={() => router.push("/apply")}
              className="px-8 py-3 bg-red-600 text-white font-mono rounded-lg hover:bg-red-700 transition-colors w-full max-w-xs"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-3xl text-red-600 animate-pulse">◆</span>
            <span className="font-display font-bold text-3xl tracking-wider text-white">HACKCLUB</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">Recruitment 2026</h1>
          <p className="text-gray-500">We don&apos;t look at resume formatting or grading points. We want to see your curiosity, your department drive, and what makes you tick.</p>
        </div>

        <div className="bg-gray-900/50 border border-red-900/30 rounded-xl p-8 backdrop-blur-sm">
          {error && (
            <div id="apply-error-banner" className="mb-6 p-4 bg-red-900/30 border border-red-600/30 rounded-lg text-red-400 text-sm animate-in fade-in-0">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Register Number *</label>
                <input
                  type="text"
                  value={formData.registerNumber}
                  onChange={(e) => handleChange("registerNumber", e.target.value)}
                  placeholder="e.g., 24BCE1024"
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Student Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="name.year@vitstudent.ac.in"
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">1st Preference Department *</label>
                <select
                  value={formData.firstPreference}
                  onChange={(e) => handleChange("firstPreference", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">2nd Preference Department</label>
                <select
                  value={formData.secondPreference}
                  onChange={(e) => handleChange("secondPreference", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer"
                >
                  <option value="None">— None (Only 1st Preference) —</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Year of Study *</label>
                <select
                  value={formData.yearOfStudy}
                  onChange={(e) => handleChange("yearOfStudy", e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 appearance-none cursor-pointer"
                >
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">GitHub Link</label>
                <input
                  type="text"
                  value={formData.github}
                  onChange={(e) => handleChange("github", e.target.value)}
                  placeholder="github.com/username"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">LinkedIn Link</label>
              <input
                type="text"
                value={formData.linkedin}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                placeholder="linkedin.com/in/username"
                className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">
                Why do you want to join your 1st Preference ({formData.firstPreference || "select department first"})? *
              </label>
              <textarea
                value={formData.firstPrefReason}
                onChange={(e) => handleChange("firstPrefReason", e.target.value)}
                placeholder={formData.firstPreference ? `Tell us why you are interested in the ${formData.firstPreference} department, relevant skills, or past experience...` : "Select 1st preference first"}
                rows={4}
                required
                disabled={!formData.firstPreference}
                className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none disabled:opacity-50"
              />
            </div>

            {formData.secondPreference && formData.secondPreference !== "None" && (
              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">
                  Why do you want to join your 2nd Preference ({formData.secondPreference})? *
                </label>
                <textarea
                  value={formData.secondPrefReason}
                  onChange={(e) => handleChange("secondPrefReason", e.target.value)}
                  placeholder={`Tell us why you are interested in the ${formData.secondPreference} department as your second choice...`}
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">Describe a project you have built or would like to build (Optional)</label>
              <textarea
                value={formData.projectDetails}
                onChange={(e) => handleChange("projectDetails", e.target.value)}
                placeholder="Give details about technologies, flow, or problem it solves."
                rows={3}
                className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
              />
            </div>

            <div className="bg-gray-900/30 border border-red-900/20 rounded-xl p-6 space-y-6">
              <h3 className="font-mono text-red-600 text-xs tracking-wider">Your Goals & Thinking</h3>

              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">
                  1. What is the one technical/design skill you want to learn through HackClub? Why? *
                </label>
                <textarea
                  value={formData.skillToLearn}
                  onChange={(e) => handleChange("skillToLearn", e.target.value)}
                  placeholder="Mention the skill and why you want to learn or master it..."
                  rows={3}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">
                  2. Why HackClub? *
                </label>
                <textarea
                  value={formData.whyHackclub}
                  onChange={(e) => handleChange("whyHackclub", e.target.value)}
                  placeholder="What draws you to HackClub over other technical clubs?"
                  rows={3}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-red-600 tracking-wider mb-1">
                  3. Someone tells you: &ldquo;Build a website that makes students more productive.&rdquo; What questions would you ask before writing a single line of code? *
                </label>
                <textarea
                  value={formData.productiveWebsiteQuestions}
                  onChange={(e) => handleChange("productiveWebsiteQuestions", e.target.value)}
                  placeholder="List the clarification, audience, features, or design questions you would ask first..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-red-900/30 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-red-600 text-white font-mono tracking-wider rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-wait transition-colors text-lg"
            >
              {submitting ? "Submitting Application..." : "🚀 Submit Application"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          By submitting, you agree to HackClub VIT Chennai&apos;s recruitment process terms.
        </p>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CustomButton, IconButton } from './UI'; // Assuming UI.jsx exists
import Sidebar from './Sidebar'; // Assuming Sidebar.jsx exists
import Header from './Header'; // Assuming Header.jsx exists

const ContactUsPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {
  // State for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // --- Simulate API Call ---
    console.log('Submitting Contact Form:', { name, email, subject, message });
    try {
      // Replace with your actual API endpoint call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // Assuming submission is successful
      setSubmitStatus('success');
      // Clear form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
       // Optional: Hide success/error message after a few seconds
       setTimeout(() => setSubmitStatus(null), 5000);
    }
    // -------------------------
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />

      {/* Main content area */}
      <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
        <Header userName={userName} />

        {/* Main container */}
        <div className="p-6">
          <h2 className="text-3xl font-bold text-white mb-6">Contact Us</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Contact Form Card */}
            <div className="lg:col-span-2">
              <Card title="Send us a Message" className="!bg-slate-800/80">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">Your Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-white/70 mb-1">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
                      placeholder="Regarding Nexus AI"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-1">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows="6"
                      className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
                      placeholder="Write your message here..."
                    />
                  </div>
                  <div className="text-right">
                    {submitStatus === 'success' && <p className="text-green-400 text-sm mb-3 text-left">Message sent successfully!</p>}
                    {submitStatus === 'error' && <p className="text-red-400 text-sm mb-3 text-left">Failed to send message. Please try again.</p>}
                    <CustomButton type="submit" disabled={isSubmitting} className="!bg-red-600 hover:!bg-red-700 !shadow-red-500/50 px-8">
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </CustomButton>
                  </div>
                </form>
              </Card>
            </div>

            {/* Contact Info Card */}
            <div className="lg:col-span-1">
              <Card title="Contact Information" className="!bg-slate-800/80">
                <div className="space-y-6 text-white/90">
                  <div className="flex items-start gap-4">
                    <span className="text-xl mt-1 text-red-400">📍</span>
                    <div>
                      <h4 className="font-semibold">Address</h4>
                      <p className="text-sm text-white/70">123 Nexus Lane,<br />Tech City, TC 12345,<br />Digital World</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-xl mt-1 text-red-400">📞</span>
                    <div>
                      <h4 className="font-semibold">Phone</h4>
                      <p className="text-sm text-white/70">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-xl mt-1 text-red-400">✉️</span>
                    <div>
                      <h4 className="font-semibold">Email</h4>
                      <p className="text-sm text-white/70">support@nexusai.example</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-4">
                    <span className="text-xl mt-1 text-red-400">🕒</span>
                    <div>
                      <h4 className="font-semibold">Support Hours</h4>
                      <p className="text-sm text-white/70">Monday - Friday<br />9:00 AM - 5:00 PM (Your Timezone)</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>

        {/* Floating AI Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <IconButton
            icon={<span className="text-2xl">🤖</span>}
            className="w-16 h-16 !bg-red-600 hover:!bg-red-700 !text-white !shadow-lg !shadow-red-500/50"
            onClick={() => alert("Nexus AI Clicked!")}
          />
        </div>
      </main>
    </div>
  );
};

export default ContactUsPage;
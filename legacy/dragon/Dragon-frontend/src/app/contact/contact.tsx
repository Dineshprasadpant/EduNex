'use client';

import { Phone, Mail, MapPin, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { apiCallService } from './__apiCall/apiCall';

interface FormData {
  name: string;
  email: string;
  subject: string;
  phone: string;
  message: string;
}

export default function ContactSection() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | { success: boolean; message: string }>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<{ type: string, value: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!captchaToken) {
      setSubmitStatus({ success: false, message: 'Please complete the captcha verification' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await apiCallService.sendContactEmail(formData, captchaToken)

      if (result.success) {
        setSubmitStatus({ success: true, message: 'Message sent successfully!' });
        setFormData({
          name: '',
          email: '',
          subject: '',
          phone: '',
          message: ''
        });
      } else {
        setSubmitStatus({ success: false, message: result.error || 'Failed to send message' });
      }
    } catch (error) {
      setSubmitStatus({ success: false, message: 'An error occurred while sending your message' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailClick = (email: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.open(`mailto:${email}`, '_blank');
  };

  const handlePhoneClick = (phone: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  const handleCopy = (type: string, value: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    navigator.clipboard.writeText(value)
      .then(() => {
        setCopiedItem({ type, value });
        setTimeout(() => setCopiedItem(null), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

  const renderContactItem = (type: 'email' | 'phone', value: string) => {
    const isCopied = copiedItem?.type === type && copiedItem?.value === value;
    const Icon = isCopied ? Check : Copy;
    const iconColor = isCopied ? 'text-emerald-500' : 'text-blue-500 hover:text-blue-700';

    return (
      <div className="group relative inline-flex items-center w-full">
        {type === 'email' ? (
          <a
            href={`mailto:${value}`}
            onClick={(e) => handleEmailClick(value, e)}
            className="hover:underline mr-2 w-full  break-all"
          >
            {value}
          </a>
        ) : (
          <a
            href={`tel:${value.replace(/[^0-9+]/g, '')}`}
            onClick={(e) => handlePhoneClick(value, e)}
            className="hover:underline  w-full mr-2 break-all"
          >
            {value}
          </a>
        )}
        <button
          onClick={(e) => handleCopy(type, value, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
          aria-label={`Copy ${type}`}
        >
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="relative w-full bg-white px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-12 lg:py-24 font-Urbanist">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <span className="text-gray-800">Get in  </span>
            <span className="text-[#010794]">Touch</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ready to start your journey with us? We're here to help you every step of the way.
          </p>
        </div>

        {/* Main Contact Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 ">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-xl  border border-gray-200">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Send us a message</h3>
              <p className="text-gray-600">Fill out the form below and we'll get back to you soon.</p>
            </div>

            {submitStatus && (
              <div className={`p-4 rounded-lg mb-6 ${submitStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="What's this about?"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+977 1234567890"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  id="message"
                  placeholder="Your message here..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAABbjHCSTOOPQ-TLq"}
                onSuccess={(token) => setCaptchaToken(token)}
                options={{ theme: 'light', action: 'submit-form' }}
              />

              <button
                type="submit"
                disabled={isSubmitting || !captchaToken}
                className={`w-full py-3 px-6 bg-[#010794] hover:bg-blue-800 text-white font-medium rounded-lg transition-colors ${
                  (isSubmitting || !captchaToken) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Information Cards */}
          <div className="space-y-8">
              
              {/* Phone Section */}
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-[#010794] rounded-xl flex items-center justify-center mr-4">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Call Us</h3>
                    <p className="text-sm text-gray-600">Mon-Fri 9AM-6PM</p>
                  </div>
                </div>
                <div className="space-y-1 border-l-2 border-gray-100 pl-6">
                  {renderContactItem('phone', '+977 9704541292')}
                  {renderContactItem('phone', '+977 01-4579540')}
                </div>
              </div>

              {/* Email Section */}
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email Us</h3>
                    <p className="text-sm text-gray-600">We reply within 24 hours</p>
                  </div>
                </div>
                <div className="space-y-1 border-l-2 border-gray-100 pl-6">
                  {renderContactItem('email', 'dragonfoundation555@gmail.com')}
                  {renderContactItem('email', 'lovekryadav105@gmail.com')}
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Visit Us</h3>
                    <p className="text-sm text-gray-600">Come see us in person</p>
                  </div>
                </div>
                <div className="border-l-2 border-gray-100 pl-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Baneshwor, Near Krishna Temple<br />
                    Kathmandu, Nepal
                  </p>
                </div>
              </div>

        
          </div>

          
        </div>

        {/* Location Section */}
        <div className="mb-20 ">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="text-gray-800">Our </span>
              <span className="text-[#010794]">Locations</span>
            </h2>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find us at these convenient locations
            </p>
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 mb-12">
            <div className="w-full h-96 bg-gray-200 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7435.4248077615575!2d85.33565013406512!3d27.687544091098303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb198429c06fa7%3A0x99cea16b5675c8ff!2sDragon%20Education%20Foundation!5e0!3m2!1sen!2snp!4v1746821480138!5m2!1sen!2snp"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                className="absolute inset-0"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Office */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <MapPin className="w-5 h-5 text-[#010794]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Main Office</h3>
              </div>
              <div className="pl-9 space-y-2">
                <p className="text-gray-700">Baneshwor, Near Krishna Temple</p>
                <p className="text-gray-700">Kathmandu, Nepal</p>
                <div className="pt-2 text-[#010794]">
                  {renderContactItem('phone', '+977 9704541292')}
                </div>
              </div>
            </div>

            {/* Branch Office */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <MapPin className="w-5 h-5 text-[#010794]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Branch Office</h3>
              </div>
              <div className="pl-9 space-y-2">
                <p className="text-gray-700">Baneshwor, Near Krishna Temple</p>
                <p className="text-gray-700">Kathmandu, Nepal</p>
                <div className="pt-2 text-[#010794]">
                  {renderContactItem('phone', '+977 01-4579540')}
                </div>
              </div>
            </div>

            {/* Support Center */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <MapPin className="w-5 h-5 text-[#010794]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Support Center</h3>
              </div>
              <div className="pl-9 space-y-2">
                <p className="text-gray-700">Baneshwor, Near Krishna Temple</p>
                <p className="text-gray-700">Kathmandu, Nepal</p>
                <div className="pt-2 text-[#010794]">
                  {renderContactItem('email', 'dragonfoundation555@gmail.com')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
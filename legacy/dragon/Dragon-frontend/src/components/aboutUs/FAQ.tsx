// FAQ Section Component with View More functionality
import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

// Define types for our components and data
interface FAQItemProps {
  title: string;
  content: string;
  isOpen: boolean;
  onClick: () => void;
}

interface FAQItem {
  id: number;
  title: string;
  content: string;
}

// FAQ Item Component
const FAQItem = ({ title, content, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className="border-b border-gray-200 py-4 sm:py-5">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onClick}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()} // Keyboard accessibility
      >
        <h3 className="text-base sm:text-lg md:text-lg lg:text-xl font-medium text-gray-800 font-Urbanist pr-4">{title}</h3>
        <button
          className={`min-w-8 min-h-8 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#08049c] flex items-center justify-center text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} flex-shrink-0`}
          type="button"
          aria-label={isOpen ? "Collapse answer" : "Expand answer"}
        >
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 sm:mt-4 text-sm sm:text-base md:text-base lg:text-lg text-gray-600 pr-2 sm:pr-8 animate-fadeIn font-Urbanist">
          <p>{content}</p>
        </div>
      )}
    </div>
  );
};

// Main FAQ Section Component
const FAQSection = () => {
  const [openItem, setOpenItem] = useState<number | null>(4); // Last item open by default
  const [viewMoreClicked, setViewMoreClicked] = useState<boolean>(false);

  // Set the number of items to show in each state
  const INITIAL_ITEMS = 4; // Number of items to show initially

  const faqItems: FAQItem[] = [
    {
      id: 1,
      title: 'What is Dragon Education Platform?',
      content: 'Dragon is an innovative education platform that offers live Zoom classes, high-quality study materials, and structured online learning experiences to help students thrive in their academic journey.'
    },
    {
      id: 2,
      title: 'How Do Online Zoom Classes Work?',
      content: 'Our Zoom classes are interactive and led by experienced instructors. Students can join from anywhere, participate in real-time discussions, ask questions, and collaborate with peers in a virtual classroom environment.'
    },
    {
      id: 3,
      title: 'What Study Materials Are Provided?',
      content: 'We provide comprehensive and easy-to-understand study materials, including lecture slides, notes, practice questions, and recorded sessions. These resources are designed to help reinforce what you learn during live classes.'
    },
    {
      id: 4,
      title: 'How Can I Track My Progress?',
      content: 'You can track your learning progress through your dashboard.'
    },
    {
      id: 5,
      title: 'How Do I Join Dragon Education?',
      content: 'Getting started is simple! Sign up on our website, choose your course or grade level, and begin attending Zoom classes. Our support team is available to guide you through the onboarding process.'
    },
    {
      id: 6,
      title: 'Is There a Free Trial?',
      content: 'Yes, we offer a free trial so you can experience our classes and platform before committing. Explore our teaching style, materials, and interaction before upgrading to a full plan.'
    },
    {
      id: 7,
      title: 'What Support Is Available for Students?',
      content: 'We offer 24/7 student support through chat, email, and helpdesk. Whether it’s a technical issue or academic question, our team is here to ensure your learning is uninterrupted.'
    },
    {
      id: 9,
      title: 'What Courses or Subjects Do You Offer?',
      content: 'Dragon covers a wide range of academic subjects including Math, Science, English, and Computer Science. We also offer skill-based programs like exam preparation.'
    },
    {
      id: 10,
      title: 'Will I Get Certificates or Assessments?',
      content: 'Yes, students receive regular assessments to evaluate their learning. Completion certificates are awarded for each course, which can be useful for academic records or portfolios.'
    },
  ];


  const toggleItem = (id: number): void => {
    setOpenItem(openItem === id ? null : id);
  };

  const toggleViewMore = (): void => {
    setViewMoreClicked(!viewMoreClicked);
    // When collapsing, ensure we don't have an open item in the hidden section
    if (viewMoreClicked && openItem && openItem > INITIAL_ITEMS) {
      setOpenItem(null);
    }
  };

  return (
    <div className="relative w-full bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-10 sm:py-12 md:py-16 lg:py-20">
      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto">
        {/* Section Header with consistent styling */}
        <div className="flex flex-col items-center justify-center mb-8 sm:mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-Urbanist xl:text-5xl 2xl:text-6xl font-bold text-center">
              <span className="text-gray-900">Frequently Asked </span>
              <span className="text-[#08049c]">Questions</span>
            </h2>
          </div>
          {/* Mobile-only divider */}
          <div className="w-20 h-1 bg-[#08049c] block sm:hidden mt-2"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 lg:gap-16">
          {/* Left side - Image */}
          <div className="w-full lg:w-1/2 relative mb-10 lg:mb-0">
            <div className="relative aspect-[3/4] w-full max-w-lg mx-auto lg:max-w-none">
              {/* Using a placeholder div with the same aspect ratio for mobile */}
              <div className=" overflow-hidden w-full h-full ">
                {/* Using standard img tag to avoid Next.js Image domain configuration issues */}
                <img
                  src="/images/faq.jpg"
                  alt="Graduate in green gown"
                  className=" object-contain w-full h-full"
                />

                {/* Shape overlay on image */}
                <div className="absolute inset-0  overflow-hidden" style={{
                  background: "linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1))",
                  mixBlendMode: "overlay"
                }}></div>
              </div>

           
            </div>
          </div>

          {/* Right side - FAQ */}
          <div className="w-full lg:w-1/2">
            {/* FAQ Container with scrollable area when needed */}
            <div className={`${viewMoreClicked ? 'max-h-[600px] overflow-y-auto pr-4 custom-scrollbar' : ''} transition-all duration-500`}>
              <div className="space-y-1">
                {/* Initial State: Always show first 4 items */}
                {!viewMoreClicked && faqItems.slice(0, INITIAL_ITEMS).map((item) => (
                  <FAQItem
                    key={item.id}
                    title={item.title}
                    content={item.content}
                    isOpen={openItem === item.id}
                    onClick={() => toggleItem(item.id)}
                  />
                ))}

                {/* View More State: Show all items with scrolling */}
                {viewMoreClicked && faqItems.map((item) => (
                  <FAQItem
                    key={item.id}
                    title={item.title}
                    content={item.content}
                    isOpen={openItem === item.id}
                    onClick={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            </div>

            {/* View More / View Less Button */}
            {faqItems.length > INITIAL_ITEMS && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={toggleViewMore}
                  className="group flex items-center justify-center gap-2 py-3 px-6 bg-white border-2 border-[#08049c] rounded-full hover:bg-blue-50 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="text-[#08049c] font-medium font-Urbanist">{viewMoreClicked ? 'View Less' : 'View More'}</span>
                  <span className={`w-7 h-7 rounded-full bg-[#08049c] flex items-center justify-center text-white transition-transform duration-300 ${viewMoreClicked ? 'rotate-45' : ''}`}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
'use client';

import React, { useState } from 'react';

// Types
type ExamType = 'math' | 'science' | 'english' | 'history' | 'computer';

interface Performer {
  id: string;
  name: string;
  score: number;
}

// Mock Data
const mockResults = {
  math: [
    { id: "MATH1001", name: "Alice Johnson", score: 98 },
    { id: "MATH1002", name: "Bob Smith", score: 96 },
    { id: "MATH1003", name: "Charlie Brown", score: 95 },
    { id: "MATH1004", name: "Diana Prince", score: 94 },
    { id: "MATH1005", name: "Edward Lewis", score: 93 },
    { id: "MATH1006", name: "Fiona Apple", score: 92 },
    { id: "MATH1007", name: "George Miller", score: 91 },
    { id: "MATH1008", name: "Hannah Montana", score: 90 },
    { id: "MATH1009", name: "Ian McKellen", score: 89 },
    { id: "MATH1010", name: "Julia Roberts", score: 88 }
  ],
  science: [
    { id: "SCI1001", name: "Marie Curie", score: 99 },
    { id: "SCI1002", name: "Albert Einstein", score: 98 },
    { id: "SCI1003", name: "Neil deGrasse Tyson", score: 97 },
    { id: "SCI1004", name: "Stephen Hawking", score: 96 },
    { id: "SCI1005", name: "Jane Goodall", score: 95 },
    { id: "SCI1006", name: "Carl Sagan", score: 94 },
    { id: "SCI1007", name: "Ada Lovelace", score: 93 },
    { id: "SCI1008", name: "Isaac Newton", score: 92 },
    { id: "SCI1009", name: "Rosalind Franklin", score: 91 },
    { id: "SCI1010", name: "Nikola Tesla", score: 90 }
  ],
  english: [
    { id: "ENG1001", name: "William Shakespeare", score: 100 },
    { id: "ENG1002", name: "Jane Austen", score: 98 },
    { id: "ENG1003", name: "Ernest Hemingway", score: 96 },
    { id: "ENG1004", name: "Virginia Woolf", score: 95 },
    { id: "ENG1005", name: "Charles Dickens", score: 94 },
    { id: "ENG1006", name: "Maya Angelou", score: 93 },
    { id: "ENG1007", name: "George Orwell", score: 92 },
    { id: "ENG1008", name: "Emily Dickinson", score: 91 },
    { id: "ENG1009", name: "J.K. Rowling", score: 90 },
    { id: "ENG1010", name: "Mark Twain", score: 89 }
  ],
  history: [
    { id: "HIST1001", name: "Howard Zinn", score: 97 },
    { id: "HIST1002", name: "Doris Kearns Goodwin", score: 96 },
    { id: "HIST1003", name: "David McCullough", score: 95 },
    { id: "HIST1004", name: "Herodotus", score: 94 },
    { id: "HIST1005", name: "Mary Beard", score: 93 },
    { id: "HIST1006", name: "Ron Chernow", score: 92 },
    { id: "HIST1007", name: "Barbara Tuchman", score: 91 },
    { id: "HIST1008", name: "Eric Foner", score: 90 },
    { id: "HIST1009", name: "Thucydides", score: 89 },
    { id: "HIST1010", name: "Jared Diamond", score: 88 }
  ],
  computer: [
    { id: "CS1001", name: "Grace Hopper", score: 100 },
    { id: "CS1002", name: "Alan Turing", score: 99 },
    { id: "CS1003", name: "Tim Berners-Lee", score: 98 },
    { id: "CS1004", name: "Linus Torvalds", score: 97 },
    { id: "CS1005", name: "Margaret Hamilton", score: 96 },
    { id: "CS1006", name: "Guido van Rossum", score: 95 },
    { id: "CS1007", name: "Donald Knuth", score: 94 },
    { id: "CS1008", name: "Barbara Liskov", score: 93 },
    { id: "CS1009", name: "John McCarthy", score: 92 },
    { id: "CS1010", name: "Brendan Eich", score: 91 }
  ]
};

const examNames = {
  math: 'Mathematics',
  science: 'Science',
  english: 'English',
  history: 'History',
  computer: 'Computer Science'
};

// Helper functions
function getExamName(examCode: string): string {
  return examNames[examCode as keyof typeof examNames] || examCode;
}

async function searchCandidate(examType: ExamType, candidateId: string): Promise<Performer | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const candidates = mockResults[examType];
  return candidates.find(c => c.id === candidateId) || null;
}

async function fetchTopPerformers(examType: ExamType): Promise<Performer[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return mockResults[examType] || [];
}

// New sharing functions
function generateShareableLink(examType: ExamType, candidateId?: string): string {
  const baseURL = window.location.origin;
  const searchParams = new URLSearchParams();

  searchParams.append('exam', examType);
  if (candidateId) {
    searchParams.append('id', candidateId);
  }

  return `${baseURL}?${searchParams.toString()}`;
}

function shareViaEmail(subject: string, body: string): void {
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink, '_blank');
}

// Social media sharing functions
function shareToFacebook(url: string): void {
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookShareUrl, '_blank', 'width=600,height=400');
}

function shareToWhatsApp(text: string, url: string): void {
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
  window.open(whatsappShareUrl, '_blank');
}

function shareToTwitter(text: string, url: string): void {
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterShareUrl, '_blank', 'width=600,height=400');
}

function shareToLinkedIn(url: string, title: string): void {
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  window.open(linkedInShareUrl, '_blank', 'width=600,height=400');
}

// Download as PDF function
function downloadAsPDF(elementId: string, filename: string): void {
  // In a real implementation, you would use a library like html2pdf.js or jsPDF
  // For simplicity, we'll just simulate the download
  alert('PDF download feature would generate a PDF of the results');

  // Example implementation with html2pdf would be:
  // if (typeof window !== 'undefined') {
  //   import('html2pdf.js').then(html2pdf => {
  //     const element = document.getElementById(elementId);
  //     const opt = {
  //       margin: 1,
  //       filename: filename,
  //       image: { type: 'jpeg', quality: 0.98 },
  //       html2canvas: { scale: 2 },
  //       jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  //     };
  //     html2pdf().set(opt).from(element).save();
  //   });
  // }
}

// Share modal component
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  examType: ExamType;
  candidateId?: string;
  studentName?: string;
  score?: number;
  isTopPerformers?: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  examType,
  candidateId,
  studentName,
  score,
  isTopPerformers
}) => {
  if (!isOpen) return null;

  const shareableLink = generateShareableLink(examType, candidateId);
  const examName = getExamName(examType);

  let emailSubject = '';
  let emailBody = '';
  let shareTitle = '';

  if (isTopPerformers) {
    emailSubject = `Top Performers in ${examName}`;
    emailBody = `Check out the top performers in ${examName}: ${shareableLink}`;
    shareTitle = `Top Performers in ${examName}`;
  } else if (studentName && score !== undefined) {
    emailSubject = `${studentName}'s ${examName} Exam Result`;
    emailBody = `${studentName} scored ${score}% in the ${examName} exam. View details here: ${shareableLink}`;
    shareTitle = `${studentName}'s ${examName} Exam Result - Score: ${score}%`;
  }

  // Function to handle downloading the result as PDF
  const handleDownload = () => {
    const filename = isTopPerformers
      ? `top_performers_${examType}.pdf`
      : `${candidateId}_result.pdf`;

    downloadAsPDF('result-container', filename);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            Share {isTopPerformers ? 'Top Performers' : 'Result'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-3">Social Media:</p>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {/* Facebook */}
            <button
              onClick={() => shareToFacebook(shareableLink)}
              className="flex flex-col items-center justify-center p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              aria-label="Share to Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z" />
              </svg>
              <span className="text-xs mt-1">Facebook</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => shareToWhatsApp(shareTitle, shareableLink)}
              className="flex flex-col items-center justify-center p-2 rounded-md bg-green-500 text-white hover:bg-green-600"
              aria-label="Share to WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-xs mt-1">WhatsApp</span>
            </button>

            {/* Twitter/X */}
            <button
              onClick={() => shareToTwitter(shareTitle, shareableLink)}
              className="flex flex-col items-center justify-center p-2 rounded-md bg-black text-white hover:bg-gray-800"
              aria-label="Share to Twitter/X"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-xs mt-1">Twitter</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => shareToLinkedIn(shareableLink, shareTitle)}
              className="flex flex-col items-center justify-center p-2 rounded-md bg-blue-700 text-white hover:bg-blue-800"
              aria-label="Share to LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span className="text-xs mt-1">LinkedIn</span>
            </button>
          </div>

          <p className="text-gray-600 mb-3">Other Options:</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Email */}
            <button
              onClick={() => shareViaEmail(emailSubject, emailBody)}
              className="flex items-center justify-center bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              <span>Email</span>
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-2">Shareable Link:</div>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={shareableLink}
              className="flex-grow p-2 border border-gray-300 rounded-l-md text-sm bg-gray-50"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareableLink);
                alert('Link copied to clipboard!');
              }}
              className="bg-gray-200 px-3 rounded-r-md hover:bg-gray-300"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
export default function Home() {
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPerformers, setIsLoadingPerformers] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [examType, setExamType] = useState<ExamType | ''>('');
  const [candidateId, setCandidateId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<Performer | null>(null);

  // New state for share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingTopPerformers, setSharingTopPerformers] = useState(false);

  // Check for URL parameters on load
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const examParam = urlParams.get('exam') as ExamType;
    const idParam = urlParams.get('id');

    if (examParam && examNames[examParam]) {
      setExamType(examParam);
      handleExamChange({ target: { value: examParam } } as React.ChangeEvent<HTMLSelectElement>);

      if (idParam) {
        setCandidateId(idParam);
        // Automatically search for the result
        setTimeout(() => {
          searchCandidate(examParam, idParam)
            .then(result => {
              if (result) {
                setResultMessage(
                  `Your score for ${getExamName(examParam)} is: ${result.score}%`
                );
                setSearchResult(result);
              } else {
                setResultMessage(`No results found for Candidate ID: ${idParam}`);
              }
            })
            .catch(error => {
              console.error('Auto-search error:', error);
              setResultMessage('An error occurred while searching. Please try again.');
            });
        }, 500);
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!examType) {
      setError('Please select an exam');
      return;
    }

    if (!candidateId) {
      setError('Please enter your Candidate ID');
      return;
    }

    setError(null);
    setIsSearching(true);
    setResultMessage(null);
    setSearchResult(null);

    try {
      const result = await searchCandidate(examType, candidateId.trim().toUpperCase());

      if (result) {
        setResultMessage(
          `Your score for ${getExamName(examType)} is: ${result.score}%`
        );
        setSearchResult(result);
      } else {
        setResultMessage(`No results found for Candidate ID: ${candidateId}`);
      }
    } catch (error) {
      setResultMessage('An error occurred while searching. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExamChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ExamType | '';
    setExamType(value);

    if (!value) {
      setTopPerformers([]);
      return;
    }

    setIsLoadingPerformers(true);

    try {
      const performers = await fetchTopPerformers(value);
      setTopPerformers(performers);
    } catch (error) {
      console.error('Error fetching top performers:', error);
    } finally {
      setIsLoadingPerformers(false);
    }
  };

  const openShareModal = (isTopPerformers: boolean = false) => {
    setSharingTopPerformers(isTopPerformers);
    setShareModalOpen(true);
  };

  return (
    <div className="relative w-full bg-gray-50 px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-6 sm:py-8">
      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto">
        <div className="flex justify-center mb-6">
          <div className="px-4 py-2 rounded-full bg-gray-900 text-white font-Urbanist font-medium">
            Results
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-5xl font-Urbanist font-bold text-center text-gray-800 mb-2">
          Exam Results
        </h1>

        <p className="text-sm sm:text-base md:text-base lg:text-lg xl:text-lg text-center text-gray-600 mb-8 font-Urbanist">
          Select an exam and enter your Candidate ID to view your results
        </p>

        {resultMessage && (
          <div id="result-container" className={`mb-6 p-4 rounded-lg text-center ${resultMessage.includes('No results') || resultMessage.includes('error')
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
            }`}>
            {resultMessage}
            {searchResult && (
              <div className="mt-2">
                <button
                  onClick={() => openShareModal(false)}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                  </svg>
                  Share this result
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-8">
          {/* Exam Search Card */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold font-Urbanist text-gray-800 mb-5 font-Urbanist">
              Search Your Results
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSearch}>
              <div className="mb-5">
                <label htmlFor="exam-select" className="block mb-1.5 font-medium font-Urbanist text-gray-700">
                  Select Exam
                </label>
                <select
                  id="exam-select"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md font-Urbanist text-base outline-none transition-colors focus:border-gray-500 appearance-none bg-white"
                  value={examType}
                  onChange={handleExamChange}
                  disabled={isSearching}
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 15px center",
                    backgroundSize: "12px"
                  }}
                >
                  <option value="">Select an exam</option>
                  <option value="math">Mathematics</option>
                  <option value="science">Science</option>
                  <option value="english">English</option>
                  <option value="history">History</option>
                  <option value="computer">Computer Science</option>
                </select>
              </div>

              <div className="mb-5">
                <label htmlFor="candidate-id" className="block mb-1.5 font-medium text-gray-700 font-Urbanist">
                  Candidate ID
                </label>
                <input
                  type="text"
                  id="candidate-id"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-base outline-none transition-colors focus:border-gray-500"
                  placeholder="Enter your Candidate ID"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  disabled={isSearching}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-md text-base font-medium cursor-pointer transition-colors bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-70"
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search Results'}
              </button>
            </form>
          </div>

          {/* Top Performers Card */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center">
                <span className="text-yellow-500 text-2xl mr-2">🏆</span>
                <h2 className="text-2xl font-semibold text-gray-800 mb-0 font-Urbanist">
                  Top Performers
                </h2>
              </div>

              {topPerformers.length > 0 && (
                <button
                  onClick={() => openShareModal(true)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path>
                  </svg>
                  Share
                </button>
              )}
            </div>

            {isLoadingPerformers ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-300"></div>
              </div>
            ) : topPerformers.length > 0 ? (
              <div className="space-y-1 font-Urbanist font-bold">
                {topPerformers.map((performer, index) => (
                  <div
                    key={performer.id}
                    className="flex justify-between py-2.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-bold font-Urbanist text-gray-800">
                      {index + 1}. {performer.name}
                    </span>
                    <span className="text-green-600 font-Urbanist font-bold">
                      {performer.score}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 font-Urbanist">
                <div className="text-gray-300 text-5xl mb-3">🎖️</div>
                <p className="text-gray-800 mb-1">Select an exam to view top performers</p>
                <p className="text-gray-400 text-sm">
                  The top 10 candidates will be displayed here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        examType={examType as ExamType}
        candidateId={sharingTopPerformers ? undefined : candidateId}
        studentName={sharingTopPerformers ? undefined : searchResult?.name}
        score={sharingTopPerformers ? undefined : searchResult?.score}
        isTopPerformers={sharingTopPerformers}
      />
    </div>
  );
}
import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import GlobalAnalyticsTracker from '@/components/GlobalAnalyticsTracker'
import { Suspense } from "react";
import { DashboardProvider } from "./dashboard/dashboardContext";
import Script from "next/script";

const urbanist = Urbanist({
  variable: "--font-Urbanist",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dragon Education Foundation | Best IOE & Engineering Prep in Nepal",
    template: "%s | Dragon Education Foundation"
  },
  description: "Nepal's #1 education platform for IOE entrance, bridge courses & language training. 1000+ students trained. Live classes, mock tests, study materials & performance analytics.",
  keywords: [
    "IOE Entrance Preparation Nepal",
    "Engineering Entrance Exam",
    "Bridge Course Nepal",
    "Language Classes Kathmandu",
    "Online Education Platform Nepal",
    "Offline Coaching Center",
    "Dragon Education IOE",
    "Pulchowk Entrance Exam",
    "Medical Entrance Preparation",
    "Computer Engineering Prep"
  ],
  openGraph: {
    type: "website",
    locale: "en_NP", // Nepal locale
    url: "https://dragoneducationfoundation.com",
    siteName: "Dragon Education Foundation",
    title: "Transform Your Career with Nepal's Best Education Platform",
    description: "Join 10,000+ students mastering IOE entrance, language skills & competitive exams through our proven system",
    images: [
      {
        url: "https://dragoneducationfoundation.com/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Dragon Education Foundation - Classroom & Online Learning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dragon Education Foundation",
    description: "🚀 Nepal's most effective IOE & competitive exam prep platform.",
    creator: "@DragonInstituteNP",
    images: ["https://dragoneducationfoundation.com/images/logo.png"],
  },
  alternates: {
    canonical: "https://dragoneducationfoundation.com",
  },
  metadataBase: new URL("https://dragoneducationfoundation.com"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "https://dragoneducationfoundation.com/images/logo.png",
    apple: "https://dragoneducationfoundation.com/images/logo.png",
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Dragon Education Foundation",
  "url": "https://dragoneducationfoundation.com",
  "logo": "https://dragoneducationfoundation.com/images/logo.png",
  "description": "Premier education platform for IOE entrance preparation and professional courses in Nepal",
  "foundingDate": "2015", 
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Baneshwor", 
    "addressLocality": "Kathmandu",
    "addressRegion": "Bagmati",
    "postalCode": "44600",
    "addressCountry": "NP"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+977 01-4579540", // Update with actual number
    "contactType": "Admissions",
    "email": "dragonfoundation555@gmail.com",
    "areaServed": "Nepal"
  },
  "sameAs": [
    "https://www.facebook.com/p/Dragon-Education-Nepal-100064024184004/"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Education Courses",
    "itemListElement": [
      {
        "@type": "OfferCatalog",
        "name": "Entrance Preparation",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Course",
              "name": "IOE Entrance Comprehensive Program",
              "description": "Complete preparation for IOE entrance exams with mock tests and personalized coaching",
              "educationalLevel": "undergraduate"
            }
          }
        ]
      },
      {
        "@type": "OfferCatalog",
        "name": "Language Courses",
        "itemListElement": [
          {
  "@type": "Offer",
  "itemOffered": {
    "@type": "Course",
    "name": "Language Courses",
    "description": "We offer comprehensive language courses in Japanese, Korean, and English, including general proficiency and exam preparation (IELTS/TOEFL)."
  }
}

        ]
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "287"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          key="json-ld"
        />
      </head>
      <body className={`${urbanist.variable} antialiased`}>
        <DashboardProvider>
          <Suspense fallback={null}>
            <GlobalAnalyticsTracker />
          </Suspense>
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}
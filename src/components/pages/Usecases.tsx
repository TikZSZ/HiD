import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Hospital, 
  Globe, 
  ShieldCheck, 
  CreditCard, 
  Truck,
  Users,
  Heart,
  Building,
  Layers,
  CheckCircle
} from 'lucide-react';

const useCases = [
  {
    icon: <GraduationCap className="w-12 h-12 text-blue-600" />,
    title: "Education & Employment",
    description: "Universities issue diplomas and transcripts as VCs. Graduates selectively disclose only their degree and field of study to employers while keeping their grades or personal details private.",
    details: [
      "Fraud-resistant diploma verification",
      "Enhances student privacy during background checks",
      "Enhanced job application processes"
    ]
  },
  {
    icon: <ShieldCheck className="w-12 h-12 text-green-600" />,
    title: "Government Services",
    description: "Citizens receive government-issued IDs, licenses, or benefits as VCs. For example, proving eligibility for welfare services without disclosing income or family details.",
    details: [
      "Secure welfare eligibility verification",
      "Enhances privacy in interactions with government agencies",
      "Reduced administrative overhead"
    ]
  },
  {
    icon: <Hospital className="w-12 h-12 text-red-600" />,
    title: "Healthcare",
    description: "Patients receive medical records as VCs and share only relevant details (e.g., vaccination status or allergies) with hospitals or insurers.",
    details: [
      "Protects patient privacy while enabling informed care",
      "Reduces administrative burden for hospitals and insurers",
      "Enhanced patient privacy"
    ]
  },
  {
    icon: <Globe className="w-12 h-12 text-purple-600" />,
    title: "Travel & Immigration",
    description: "Travelers use VCs for visas, vaccination records, or residency permits. They disclose only the required details to airlines, border officials, or housing services.",
    details: [
      "Quick border processing",
      "Vaccination record verification",
      "Minimal personal data exposure"
    ]
  },
  {
    icon: <CreditCard className="w-12 h-12 text-indigo-600" />,
    title: "Financial Services",
    description: "Banks issue VCs for credit scores, loan approvals, or KYC compliance. Customers selectively disclose relevant information when applying for services.",
    details: [
      "Simplifies cross-institution KYC processes",
      "Enhances user control over financial data sharing",
      "Reduced identity theft risk"
    ]
  },
  {
    icon: <Truck className="w-12 h-12 text-orange-600" />,
    title: "Supply Chain",
    description: "Ensure transparency while protecting competitive information",
    details: [
      "Ethical sourcing verification",
      "Regulatory compliance proof",
      "Confidential origin tracking"
    ]
  },
  {
    icon: <Heart className="w-12 h-12 text-pink-600" />,
    title: "Charity & Donations",
    description: "Transparent giving with donor privacy intact",
    details: [
      "Verified donation records",
      "Tax benefit documentation",
      "Donor anonymity protection"
    ]
  },
  {
    icon: <Layers className="w-12 h-12 text-teal-600" />,
    title: "Web3 & Decentralized Systems",
    description: "Empower decentralized communities with verifiable credentials",
    details: [
      "DAO membership verification",
      "Reputation scoring",
      "Anonymous collaboration"
    ]
  }
];

const UseCasesPage: React.FC = () => {
  const [selectedUseCase, setSelectedUseCase] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-br from-primary/10 to-primary/20 py-20 text-center"
      >
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Decentralized Identity: Transforming Industries
          </h1>
          <p className="text-xl max-w-3xl mx-auto text-muted-foreground mb-8">
            HiD enables secure, privacy-preserving credential verification across multiple domains, 
            revolutionizing how organizations and individuals share sensitive information.
          </p>
          <Button size="lg" variant="default">Explore Potential</Button>
        </div>
      </motion.section>

      {/* Use Cases Grid */}
      <section className="py-16 bg-secondary/5 max-w-[90%] mx-auto">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setSelectedUseCase(index)}
                onHoverEnd={() => setSelectedUseCase(null)}
                className={`
                  p-6 rounded-xl transition-all duration-300 
                  ${selectedUseCase === index 
                    ? 'bg-primary/10 scale-105 shadow-xl' 
                    : 'bg-secondary/30 hover:bg-primary/5'}
                `}
              >
                <div className="mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground mb-4">{useCase.description}</p>
                {(
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {useCase.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Highlight */}
      <section className="py-16 bg-primary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Powered by Advanced Cryptography</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-muted-foreground mb-8">
              Our platform leverages BBS+ signature schemes to enable unprecedented levels of 
              selective disclosure, ensuring privacy, efficiency, and granular control over 
              credential sharing.
            </p>
            <Button variant="outline">Learn About Our Technology</Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-secondary/10 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Identity Ecosystem?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover how HiD can revolutionize credential verification and privacy in your organization.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" variant="default">Schedule Demo</Button>
            <Button size="lg" variant="outline">Contact Sales</Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default UseCasesPage;
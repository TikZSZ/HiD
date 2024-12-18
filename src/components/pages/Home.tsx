import React, { useState } from 'react';
import { motion } from 'framer-motion';
import
  {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import
  {
    ShieldCheck,
    Globe,
    Lock,
    Users,
    Activity,
    Zap,
    Layers,
    CheckCircle,
    ArrowRight
  } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';

const HidLandingPage: React.FC = () =>
{
  const [ activeFeature, setActiveFeature ] = useState<number | null>( null );

  const features = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: "Decentralized Identity",
      description: "Secure, private identity management powered by cutting-edge cryptography",
      details: "BBS-2023 Ready"
    },
    {
      icon: <Lock className="w-10 h-10 text-primary" />,
      title: "Selective Disclosure",
      description: "Control exactly what personal information you share",
      details: "Privacy Guaranteed"
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: "Enterprise & Individual Support",
      description: "Seamless solutions for both organizations and individuals",
      details: "Scalable Approach"
    },
    {
      icon: <Globe className="w-10 h-10 text-primary" />,
      title: "Global Compatibility",
      description: "Built on open standards for seamless interoperability",
      details: "Industry Standards"
    }
  ];

  const workflowSteps = [
    {
      icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
      title: "Create Identity",
      description: "Establish your secure digital identity with ease"
    },
    {
      icon: <ArrowRight className="w-12 h-12 text-purple-600" />,
      title: "Issue Credentials",
      description: "Securely issue and manage verifiable credentials"
    },
    {
      icon: <Globe className="w-12 h-12 text-green-600" />,
      title: "Share Selectively",
      description: "Control and share your information precisely"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const heroVariants = {
    initial: { opacity: 0, y: 50 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.section
        initial="initial"
        animate="animate"
        variants={heroVariants}
        className="relative h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-br from-background via-background to-primary/10"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold text-foreground mb-6"
        >
          Democratizing Decentralized Identity
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl max-w-2xl mx-auto text-muted-foreground mb-8"
        >
          HiD: Secure, Simple Verifiable Credentials for Enterprises and Individuals
        </motion.p>

        <div className="flex space-x-4">
          <Link to={"/docs"}>
            <Button size="lg" variant="outline">Learn More</Button>
          </Link >
          <Link to={"/dashboard"}>
            <Button size="lg" variant="default">Get Started</Button>
          </Link>
        </div>
      </motion.section>

      {/* Key Features Section */}
      <section className="py-16 px-4 bg-secondary/10">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map( ( feature, index ) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="bg-secondary/30 p-6 rounded-xl shadow-md hover:shadow-xl transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <Badge variant="secondary">{feature.details}</Badge>
              </motion.div>
            ) )}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
            Your Journey with HiD
          </h2>
          <div className="flex justify-center space-x-8">
            {workflowSteps.map( ( step, index ) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.2
                }}
                className="text-center max-w-xs"
              >
                <div className="flex justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < workflowSteps.length - 1 && (
                  <div className="h-12 border-r-2 border-primary/30 my-4 mx-auto" />
                )}
              </motion.div>
            ) )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-secondary/5">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-blue-50/50 p-6 rounded-xl text-center dark:bg-secondary/30"
            >
              <Lock className="mx-auto w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-foreground">Security First</h3>
              <p className="text-muted-foreground">PBKDF-secured keys and robust cryptographic standards.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-green-50/50 p-6 rounded-xl text-center dark:bg-secondary/30"
            >
              <Layers className="mx-auto w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-foreground">Scalable Solutions</h3>
              <p className="text-muted-foreground">From individuals to enterprises, we've got you covered.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-purple-50/50 p-6 rounded-xl text-center dark:bg-secondary/30"
            >
              <Globe className="mx-auto w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-foreground">Global Compatibility</h3>
              <p className="text-muted-foreground">Built on open standards for seamless interoperability.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Previous CTA Section */}
      <section className="bg-primary/10 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-6">Start Your Decentralized Identity Journey</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join HiD and take control of your digital identity with enterprise-grade security and user-friendly design.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to={"/signup"}>
            <Button size="lg" variant="default">Create Account</Button>      
            </Link>
            <Button size="lg" variant="outline">Book Demo</Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HidLandingPage;
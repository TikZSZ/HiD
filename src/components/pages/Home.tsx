import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Code,
  Zap,
  Database,
  Shield,
  Layers,
  Upload,
  Globe,
  Users,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { Link } from "react-router-dom";

const LandingPage = () => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef = useRef(null);
  const heroRef = useRef(null);
  const cardsRef = useRef([]);
  const particlesRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      [titleRef.current, subtitleRef.current, buttonRef.current],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.2, duration: 1, ease: "power2.out" }
    );

    gsap.fromTo(
      heroRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top center",
        },
      }
    );

    cardsRef.current.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
          },
          onComplete: () => {
            gsap.to(card, {
              y: Math.random() * 20,
              duration: 7,
              ease: "power1.inOut",
              yoyo: true,
              repeat: -1,
            });
          },
        }
      );
    });
    // Animate background gradient
    gsap.to(heroRef.current, {
      backgroundPosition: "100% 100%",
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Animate particles
    const particles = particlesRef.current!.children!;
    gsap.to(particles, {
      y: "random(-20, 20)",
      x: "random(-20, 20)",
      rotation: "random(-15, 15)",
      duration: "random(3, 5)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: {
        each: 0.1,
        from: "random",
      },
    });
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--primary)/0.1)] to-[hsl(var(--background))]  bg-[length:400%_400%] flex items-center overflow-hidden"
    >
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-[hsl(var(--primary)/0.3)] rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          ></div>
        ))}
      </div>

      <main className="max-w-6xl mx-auto flex flex-col justify-center items-center py-20 px-4 text-center">
        <section className="mb-16 min-h-[50vh] md:min-h-[85vh]">
          <div className="mt-12 md:mt-56">
            <h2
              ref={titleRef}
              className="text-5xl md:text-6xl font-extrabold text-[hsl(var(--foreground))] leading-tight mb-6"
            >
              Empower Your{" "}
              <span className="text-[hsl(var(--primary))]">Hedera dApp</span>{" "}
              with AI Chat
            </h2>
            <p
              ref={subtitleRef}
              className="text-xl text-center text-[hsl(var(--muted-foreground))] ml-auto mr-auto max-w-2xl"
            >
              Add intelligent conversations and Web3 actions to your application
              with just a few lines of code. Unlock the power of AI-driven
              blockchain interactions.
            </p>
            <div ref={buttonRef} className="space-x-4 mt-6">
              <a
                href="https://www.youtube.com/watch?v=Fbj2GuQgGTw"
                target="_blank"
              >
                <Button
                  size="lg"
                  className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:scale-105 transition-transform duration-300 text-[hsl(var(--primary-foreground))]"
                >
                  Try Demo
                </Button>
              </a>
              <a href="https://github.com/TikZSZ/hedera-chat" target="_blank">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--foreground))] hover:text-[hsl(var(--background))] hover:scale-105 transition-transform duration-300"
                >
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-3xl font-bold mb-8">Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Chat",
                description:
                  "Engage users with an intelligent chatbot that understands Web3 concepts and Hedera specifics.",
                icon: <MessageSquare className="mr-2" />,
              },
              {
                title: "Easy Integration",
                description:
                  "Implement our SDK with just a few lines of code. No complex setup required.",
                icon: <Code className="mr-2" />,
              },
              {
                title: "Web3 Actions",
                description:
                  "Allow your AI assistant to perform blockchain actions via MetaMask integration.",
                icon: <Zap className="mr-2" />,
              },
              {
                title: "Token Management",
                description:
                  "Easily manage token creation, transfers, and queries directly within the chat interface.",
                icon: <Database className="mr-2" />,
              },
              {
                title: "Secure Transactions",
                description:
                  "Ensure the safety of your assets with a fully transparent, user-verified transaction process.",
                icon: <Shield className="mr-2" />,
              },
              {
                title: "Customizable Tools",
                description:
                  "Access a marketplace of tools, customizable to suit your business needs.",
                icon: <Layers className="mr-2" />,
              },
              {
                title: "Over-the-Air Updates",
                description:
                  "Deploy updates to your tools and prompts seamlessly with cloud-based CI/CD support.",
                icon: <Upload className="mr-2" />,
              },
              {
                title: "Real-World Asset Tokenization",
                description:
                  "Tokenize and manage real-world assets with ease, connecting physical and digital worlds.",
                icon: <Globe className="mr-2" />,
              },
              {
                title: "Community Driven",
                description:
                  "Join a growing community of developers and users driving innovation on Hedera.",
                icon: <Users className="mr-2" />,
              },
            ].map((feature, index) => (
              <Card
                key={index}
                ref={(el) => (cardsRef.current[index] = el)}
                className="transition-transform transform hover:scale-105"
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {feature.icon}
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>{feature.description}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16 min-w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2" />
                See it in Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              
            </CardContent>
          </Card>
        </section>

        <section className="text-center mb-16">
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <Link to="/signup"><Button size="lg">Sign Up for Free</Button></Link>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
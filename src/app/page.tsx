"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, CheckSquare, Users, Zap, Clock, Target, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: Calendar,
    title: "Smart Calendar",
    description: "Organize your schedule with an intuitive calendar that adapts to your workflow.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: CheckSquare,
    title: "Event Planning",
    description: "Create and manage events effortlessly with powerful planning tools.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Target,
    title: "Project Management",
    description: "Keep your projects on track with streamlined task management and collaboration.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with shared calendars and real-time updates.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Monitor time spent on tasks and optimize your productivity.",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    icon: Zap,
    title: "Quick Actions",
    description: "Get things done faster with keyboard shortcuts and smart automation.",
    gradient: "from-yellow-500 to-orange-500"
  }
];

export default function Home() {
  const today = new Date().getDate();
  
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-20 pb-32">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Simple. Efficient. Powerful.
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
          >
            Welcome to Hoopifye
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
          >
            Your all-in-one solution for calendar management, event planning, and project organization.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button size="lg" className="text-lg px-8 gap-2 group" asChild>
              <Link href="/auth?tab=signup">
                Start Free Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* Animated graphic/illustration */}
          <motion.div
            variants={fadeInUp}
            className="relative mt-16 mx-auto max-w-4xl"
          >
            <div className="relative rounded-2xl overflow-hidden border bg-card shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20" />
              <div className="relative p-8 md:p-12">
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {Array.from({ length: 31 }).map((_, i) => {
                    const dayNumber = i + 1;
                    const isHighlighted = dayNumber <= today;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.02, duration: 0.3 }}
                        className={`aspect-square rounded-lg ${
                          isHighlighted
                            ? "bg-gradient-to-br from-primary to-purple-500"
                            : "bg-muted/50"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(today / 31) * 100}%` }}
                    transition={{ delay: 2, duration: 0.8 }}
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-purple-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you stay organized and productive
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="h-full group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-muted">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="relative overflow-hidden border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-transparent" />
            <CardContent className="relative p-8 md:p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Get Organized?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users who trust Hoopifye to manage their calendars, events, and projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 gap-2 group" asChild>
                  <Link href="/auth?tab=signup">
                    Start Free Today
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <Link href="/auth?tab=login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer className="relative container mx-auto px-4 py-8 border-t">
        <div className="flex flex-row items-center justify-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Hoopifye Logo" 
            width={24} 
            height={24}
            className="opacity-70"
          />
          <p className="text-sm text-muted-foreground">
            © 2026 All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
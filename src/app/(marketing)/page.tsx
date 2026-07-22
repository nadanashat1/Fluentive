"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  Check,
  ArrowRight,
  BarChart3,
  Mail,
  Target,
  Clock
} from "lucide-react";

// Startup Landing Page - High Converting Design
export default function LandingPage() {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: Sparkles,
      title: "AI Sales Copilot",
      description: "Auto lead scoring, smart follow-ups, and deal closing suggestions powered by AI",
    },
    {
      icon: TrendingUp,
      title: "Growth Analytics",
      description: "Real-time conversion rates, revenue predictions, and sales velocity tracking",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Assign leads, track activities, and collaborate with role-based access",
    },
    {
      icon: Zap,
      title: "Real-time Pipeline",
      description: "Drag & drop deals with live updates and team synchronization",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with tenant isolation and audit logs",
    },
    {
      icon: BarChart3,
      title: "Smart Reporting",
      description: "Automated reports and insights to close more deals faster",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      description: "Perfect for freelancers",
      features: ["Up to 100 leads", "Basic AI assistant", "Email support", "1 team member"],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      description: "For growing teams",
      features: [
        "Up to 1,000 leads",
        "Advanced AI features",
        "Priority support",
        "10 team members",
        "Analytics dashboard",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Business",
      price: "$99",
      period: "/month",
      description: "For scaling companies",
      features: [
        "Unlimited leads",
        "Full AI suite",
        "Dedicated support",
        "Unlimited team",
        "API access",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Fluentive
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Now with AI Sales Copilot
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Close More Deals with{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              AI-Powered CRM
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The modern sales platform that helps teams convert leads faster with 
            intelligent automation and real-time insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/register"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo"
              className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition"
            >
              Watch Demo
            </a>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900">10,000+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">$2M+</div>
              <div className="text-gray-600">Revenue Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">40%</div>
              <div className="text-gray-600">Conversion Boost</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">4.9/5</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Sales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From lead capture to deal closure, Fluentive provides the tools 
              modern sales teams need to win.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl ${
                  plan.popular
                    ? "bg-gradient-to-b from-violet-600 to-indigo-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className={plan.popular ? "text-violet-100" : "text-gray-600"}>
                    {plan.description}
                  </p>
                </div>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? "text-violet-200" : "text-gray-500"}>
                    {plan.period}
                  </span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3">
                      <Check className={`w-5 h-5 ${plan.popular ? "text-violet-300" : "text-violet-600"}`} />
                      <span className={plan.popular ? "text-violet-100" : "text-gray-600"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl font-semibold transition ${
                    plan.popular
                      ? "bg-white text-violet-600 hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Sales?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of sales teams already using Fluentive to close more deals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-6 py-4 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none flex-1"
            />
            <Link
              href={`/register?email=${encodeURIComponent(email)}`}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition whitespace-nowrap"
            >
              Get Started Free
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Free 14-day trial • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Fluentive</span>
            </div>
            <p className="text-sm">
              AI-powered CRM for modern sales teams.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">About</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms</a></li>
              <li><a href="#" className="hover:text-white transition">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          © 2025 Fluentive. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

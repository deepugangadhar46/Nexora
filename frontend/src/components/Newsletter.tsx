import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Thank you for subscribing!",
        description: "You'll receive updates about NEXORA soon."
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };
  return <section id="newsletter" className="bg-white dark:bg-gray-900 py-8 md:py-12 transition-colors duration-300">
      <div className="section-container animate-on-scroll">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="pulse-chip">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pulse-500 text-white mr-2">05</span>
              <span>Newsletter</span>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-3 text-left text-gray-900 dark:text-white">Join the NEXORA Revolution</h2>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mb-6 text-left">
            Be first to hear about new features, success stories, and early access opportunities to build your startup
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-grow">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="w-full px-5 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-pulse-500 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" required />
            </div>
            <button type="submit" disabled={isSubmitting} className="bg-pulse-500 hover:bg-pulse-600 text-white font-medium py-3 px-8 rounded-full transition-all duration-300 md:ml-2">
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </section>;
};
export default Newsletter;
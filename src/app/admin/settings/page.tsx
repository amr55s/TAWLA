'use client';

import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-text-heading mb-6">Settings</h2>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-card rounded-2xl p-8 shadow-card text-center"
      >
        <p className="text-text-muted">Settings page coming soon.</p>
      </motion.div>
    </div>
  );
}

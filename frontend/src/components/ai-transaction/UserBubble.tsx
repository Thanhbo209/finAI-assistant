import { motion } from "framer-motion";

interface UserBubbleProps {
  text: string;
}

export function UserBubble({ text }: UserBubbleProps) {
  return (
    <motion.div
      className="flex justify-end"
      initial={{ opacity: 0, y: 10, x: 6 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm shadow-primary/20">
        {text}
      </div>
    </motion.div>
  );
}

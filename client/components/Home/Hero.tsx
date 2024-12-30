"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import { CtaButton } from "./CtaButton";
import { Footprints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnimatedLines } from "../ui/lines";
import PathwayBackground from "../ui/path";

export const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center">
      <PathwayBackground />
      <div className="flex flex-col items-center space-y-8 z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0 },
          }}
          className="bg-background rounded-full relative w-32 h-32 flex justify-center items-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], scale: 1.1 }}
            transition={{
              duration: 2.5,
              delay: 1.5,
              ease: [0.05, 0.6, 0.3, 0.3],
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="rounded-full w-40 h-40 absolute bg-gradient-to-b from-primary/20 via-primary/10 via-20% to-transparent to-80% border-[0.5px] border-primary/10 shadow-inner z-20"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], scale: 1.1 }}
            transition={{
              duration: 3,
              delay: 1,
              ease: [0.05, 0.6, 0.3, 0.3],
              repeat: Infinity,
              repeatDelay: 1,
            }}
            className="rounded-full w-32 h-32 absolute bg-gradient-to-b from-primary/40 via-primary/20 via-20% to-transparent to-80% border-[0.5px] border-primary/20 shadow-inner z-30"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0], scale: 1.1 }}
            transition={{
              duration: 3.5,
              delay: 0.5,
              ease: [0.05, 0.6, 0.3, 0.3],
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="rounded-full w-24 h-24 absolute bg-gradient-to-b from-primary/60 via-primary/40 via-20% to-transparent to-80% border-[0.5px] border-primary/40 shadow-inner z-40"
          />
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.2 }}
            exit={{ scale: 1 }}
            transition={{
              duration: 4,
              delay: 0,
              ease: [0.05, 0.6, 0.3, 0.3],
              repeat: Infinity,
              repeatDelay: 0,
            }}
            className="rounded-full p-4 w-18 h-18 absolute flex items-center justify-center bg-gradient-to-b from-primary/60 via-primary/40 via-20% to-transparent to-80% shadow-inner backdrop-blur-lg z-50"
          >
            <Image src={"/icon.png"} alt="logo" width={34} height={34} />
          </motion.div>
        </motion.div>
        <div className="space-y-8 flex-1 relative">
          <div className="flex flex-col items-center justify-center max-w-screen-md">
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.15 }}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 },
              }}
              className="border-[0.5px] border-muted-foreground/20 bg-secondary/60 backdrop-blur-lg rounded-xl w-fit px-3 min-h-12 text-center text-sm md:text-base inline-flex items-center mb-8 font-light"
            >
              <div className="p-1 rounded-full bg-primary mr-2">
                <Footprints className="w-4 h-4" />
              </div>
              <p className="font-semibold text-sm text-orange-400">Now live on 7 chains</p>
            </motion.div>
            <div className="flex-1">
              <motion.h1
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.35 }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="font-bold text-center leading-normal text-3xl md:text-5xl text-foreground "
              >
                Take your USDC for a walk across Blockchains
              </motion.h1>
              <motion.p
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5, delay: 0.5 }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="font-medium text-center leading-normal text-sm md:text-base text-muted-foreground/50 mx-4 mt-4"
              >
                Pathway simplifies the process of sending and receiving USDC
                across different EVM networks and Cosmos chains. Easily move
                money without friction.
              </motion.p>
            </div>
          </div>
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.65 }}
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0 },
            }}
            className="inline-flex items-center justify-center w-full"
          >
            <CtaButton />
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.8 }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            className="hidden md:block"
          >
            <Badge className="absolute -left-36 top-16 border-[0.5px] border-muted-foreground/20 bg-secondary/60 backdrop-blur-lg font-light text-foreground text-sm">
              Speed
              <svg
                className="w-4 h-4 text-primary absolute transform translate-x-[51px] -translate-y-4"
                data-slot="icon"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
              </svg>
            </Badge>
            <Badge className="absolute left-2 -top-20 border-[0.5px] border-muted-foreground/20 bg-secondary/60 backdrop-blur-lg font-light text-foreground text-sm">
              Simplicity
              <svg
                className="w-4 h-4 text-primary absolute transform translate-x-[74px] -translate-y-4"
                data-slot="icon"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="m9.653 16.915-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 0 1 8-2.828A4.5 4.5 0 0 1 18 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 0 1-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 0 1-.69.001l-.002-.001Z"></path>
              </svg>
            </Badge>
            <Badge className="absolute right-2 -top-20 border-[0.5px] border-muted-foreground/20 bg-secondary/60 backdrop-blur-lg font-light text-foreground text-sm">
              Secure
              <svg
                className="w-4 h-4 text-primary absolute transform -translate-x-7 -translate-y-4"
                data-slot="icon"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  clipRule="evenodd"
                  fillRule="evenodd"
                  d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.75Zm4.196 5.954a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                ></path>
              </svg>
            </Badge>
            <Badge className="absolute -right-36 top-16 border-[0.5px] border-muted-foreground/20 bg-secondary/60 backdrop-blur-lg font-light text-foreground text-sm">
              Stability
              <svg
                className="w-4 h-4 text-primary absolute transform -translate-x-7 -translate-y-4"
                data-slot="icon"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443ZM9.25 18.693v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z"></path>
              </svg>
            </Badge>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

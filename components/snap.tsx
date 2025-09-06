"use client"
import React, { useRef, useEffect } from 'react';
import Cards from "@/components/cards";
import FoodTrucks from "@/components/foodtrucks";
import { isOpen } from "./mealstatus"

const Snap = () => {
    // dumb way to autoscroll to an open dc when pav is closed
    const dcCardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const pavIsOpen = isOpen("pav");
        const dcIsOpen = isOpen("dc");
        if (!pavIsOpen && dcIsOpen) {
        if (dcCardRef.current) {
            dcCardRef.current.scrollIntoView({
            behavior: 'smooth', 
            block: 'start',   
            inline: 'center'    
            });
        }
        }
    }, []);
  return (
        <div className="flex snap-mandatory snap-x overflow-x-auto w-full px-36 gap-3 py-2 overflow-y-auto scrollbar-hide">
            <div><Cards name="Pavilion" location="pav" /></div>
            <div ref={dcCardRef}>
                <Cards name="Dining Center" location="dc" />
            </div>
            <div>
                <FoodTrucks />
            </div>
        </div>
  )
}

export default Snap
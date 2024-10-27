"use client"
import React from 'react'
import MainCard from './mainCard';
import {ScrollShadow} from "@nextui-org/react";

interface containerProps{
    pavMenuItems: any;
    dcMenuItems: any;
}
const container: React.FC<containerProps> = ({pavMenuItems,dcMenuItems}) => {
  return (
    <div className="w-full">
      <ScrollShadow className="h-full">
      <div className="flex snap-mandatory snap-x overflow-x-auto w-full px-36 gap-3">
        <MainCard location="Pav" items={pavMenuItems}/>
        <MainCard location="DC" items={dcMenuItems}/>
        <MainCard location="Food Trucks (WIP)" items={dcMenuItems}/>
      </div>
      </ScrollShadow>
    </div>
  )
}

export default container
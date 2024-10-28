"use client"
import * as React from 'react'
import {Card} from "@nextui-org/react";
import Description from "@/components/description"

interface MainCardProps{
    location: string;
    items: any;
}

const MainCard: React.FC<MainCardProps> = ({location, items}) => {
  return (
    <Card className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col">
        <h1 className="text-2xl text-violet-400 mb-1">{location}</h1>
        <ul>
            {items.map((item:any, index:any) => (
            <li key={index}>
                <div className="text-sm">
                    <div className="flex flex-col border-1 my-4 p-2 rounded-lg border-foreground/10 bg-foreground/5">
                      <strong className="text-lg">{item.name}</strong> 
                      <div className="">
                        {<Description description={item.description}></Description>}
                      </div>
                    </div>
                </div>
            </li>
            ))}
        </ul>
    </Card>
  )
}

export default MainCard
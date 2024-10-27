"use client"
import * as React from 'react'
import {Card, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";
interface MainCardProps{
    location: string;
    items: any;
}

const MainCard: React.FC<MainCardProps> = ({location, items}) => {
  return (
    <Card className="snap-center shrink-0 w-[300px] rounded-lg max-w-[300px] pl-5 pr-5 pt-3 pb-3 flex flex-col">
        <h1 className="text-2xl text-[#F38BA8] mb-1">{location}</h1>
        <ul>
            {items.map((item:any, index:any) => (
            <li key={index}>
                <div className="text-sm">
                    <div className="flex gap-2">
                      <strong>{item.name}</strong> 
                      <p className="">{(item.description.includes(":") ? item.description.match(/^[^:]+/)[0] : "")}</p>
                    </div>
                    <p className="text-[#9b9ea1]">{item.description.replace(/^[^:]*:\s*/, "")}</p>
                </div>
            </li>
            ))}
        </ul>
    <Dropdown backdrop="blur">
      <DropdownTrigger>
        <Button 
          variant="bordered" 
        >
          Test
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
        <DropdownItem key="new">test</DropdownItem>
        <DropdownItem key="copy">test</DropdownItem>
        <DropdownItem key="edit">test</DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger">
          test
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
    </Card>
  )
}

export default MainCard
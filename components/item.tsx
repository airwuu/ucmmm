import React from 'react'
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button} from "@nextui-org/react";


interface itemProps{
    name: any;
}
const item: React.FC<itemProps> = ({name}) => {
  return (
    <Dropdown backdrop="blur">
      <DropdownTrigger>
        <Button 
          variant="solid" 
          size="sm"
          className=" text-md font-light"
        >
          {name}
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions" disabledKeys="w">
        <DropdownItem key="w">{name}</DropdownItem>
        <DropdownItem key="copy">test</DropdownItem>
        <DropdownItem key="edit">test</DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger">
          Report Missing
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}

export default item
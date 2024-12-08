import { PlusIcon } from "lucide-react"
import { Button } from "../ui/button"

export const PageHeader: React.FC<{title:string,description:string,onClick:()=>void,buttonText?:string}> = ({title,description,onClick,buttonText}) =>
{
  return (
    <div className="flex justify-between items-center py-4">
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onClick} className="flex items-center">
        <PlusIcon className="mr-2 h-4 w-4" />
        {buttonText ? buttonText : "Create"}
      </Button>
    </div>
  )
}
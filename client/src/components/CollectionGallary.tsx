import {useState, useEffect} from "react";
interface CollectionGallaryProps {
    isOpen: Boolean,
    onClose: () => void,
    title: string
}

export async function CollectionGallary(
    {
        isOpen,
        onClose,
        title

    } : CollectionGallaryProps
) {
    const[collectionId, setCollectionId] = useState(-1);

    useEffect(() => {
        if(!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if ( e.key === "Escape") onClose;
        }

        document.addEventListener( "keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener( "keydown", handleKeyDown);
            document.body.style.overflow = "";
    }
}, [isOpen, onClose])

    return(
        <>
            <div className = "collectionGallaryBody">
                <div>
                    
                </div>
            </div>
        </>
    )

}
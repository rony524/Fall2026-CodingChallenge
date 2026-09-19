import {type CollectionItem} from "../types";

interface CollectionsProps {
    collections: CollectionItem[];
}

export function Collections(
    {collections}
: CollectionsProps) {
    return(
        <div className="collections-grid">
      {collections.map((collection) => (
        <button key={collection.id} type="button" className="collection-card">
          <img src={collection.coverSrc} alt="" />
          <div className="collection-card-info">
            <span className="collection-card-name">{collection.name}</span>
            <span className="collection-card-count">{collection.imageCount} photos</span>
          </div>
        </button>
      ))}
    </div>
    )
}
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ShopDraftDto } from "../../../types/shop";
import Block from "./Block";

const GroundingSourcesBlock = ({ draft }: { draft: ShopDraftDto }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleIsOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <Block>
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Grounding Sources</h2>
        <button className="btn btn-sm btn-circle" onClick={toggleIsOpen}>
          {isOpen ? (
            <ChevronDown className="pt-0.5" />
          ) : (
            <ChevronRight className="pl-0.5" />
          )}
        </button>
      </div>
      {isOpen && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {draft.aiGroundingSources.sources.map((source) => {
              return (
                <span className="badge badge-soft" key={source.uri}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-1 items-center"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${source.title}&sz=64`}
                      className="w-4 h-4"
                    ></img>

                    {source.title}
                  </a>
                </span>
              );
            })}
          </div>

          <div className="h-[1.5px] w-full bg-base-content/10"></div>

          <h2 className="font-semibold">Search Queries</h2>

          <div className="flex flex-wrap gap-2">
            {draft.aiGroundingSources.webSearchQueries.map((query) => (
              <span className="badge badge-soft">
                <a
                  href={`https://google.com/search?q=${query.replaceAll(
                    '"',
                    ""
                  )}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {query.replaceAll('"', "")}
                </a>
              </span>
            ))}
          </div>
        </div>
      )}

      <span className="text-xs opacity-50">Provided by Google Gemini</span>
    </Block>
  );
};

export default GroundingSourcesBlock;

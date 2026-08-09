import { useState } from "react";
import type { ShopDraftDto } from "../../../types/shop";
import { WorkScheduleDisplay } from "../../ShopDetail";
import FieldBlockWithAiReviewResult from "./FieldBlockWithAiReviewResult";

const WorkScheduleBlock = ({ draft }: { draft: ShopDraftDto }) => {
  const [viewMode, setViewMode] = useState<"group" | "list">("group");
  const ids = Array.from(
    { length: draft.workSchedules.length },
    () => Math.floor(Math.random() * 100) + 1
  );

  function formatMinutesToHHMM(mins: number): string {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    const pad = (num: number): string => num.toString().padStart(2, "0");

    return `${pad(hours)}:${pad(remainingMins)}`;
  }

  return (
    <FieldBlockWithAiReviewResult draft={draft} fieldName="workSchedules">
      <div className="flex flex-col gap-2">
        <span className="opacity-50">營業時間</span>

        <div className="flex space-x-1 p-1 bg-base-300 rounded-xl">
          <button
            onClick={() => setViewMode("group")}
            className={
              viewMode === "group"
                ? "btn flex-1 bg-base-100"
                : "flex-1 text-sm px-4"
            }
          >
            Group
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list"
                ? "btn flex-1 bg-base-100"
                : "flex-1 text-sm px-4"
            }
          >
            List
          </button>
        </div>

        {viewMode === "group" ? (
          <WorkScheduleDisplay workSchedules={draft.workSchedules} />
        ) : (
          <div className="flex flex-col gap-1 px-4">
            {draft.workSchedules.map((schedule, i) => {
              return (
                <div key={ids[i]} className="flex justify-between">
                  <span>{schedule.weekday}</span>

                  <div className="flex gap-2 items-center">
                    {schedule.scheduleNote && (
                      <span className="badge badge-soft badge-sm">
                        {schedule.scheduleNote}
                      </span>
                    )}
                    <span>
                      {formatMinutesToHHMM(schedule.startMinuteOfDay)} ~{" "}
                      {formatMinutesToHHMM(schedule.endMinuteOfDay)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FieldBlockWithAiReviewResult>
  );
};

export default WorkScheduleBlock;

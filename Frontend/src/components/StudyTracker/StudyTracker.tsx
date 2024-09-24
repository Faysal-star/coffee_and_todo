import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import Todo from "../ToDo/ToDo";

const API_URL = "http://localhost:3001/api";

interface Entry {
  id: string;
  date: string;
  topic: string;
  hours: boolean[];
}

interface DistinctDayStat {
  [date: string]: number;
}

const StudyTracker: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [topic, setTopic] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [distinctDayStat, setDistinctDayStat] = useState<DistinctDayStat>({});

  useEffect(() => {
    fetchEntries();
  }, []);

  const distinctDayStatFun = useCallback(() => {
    const distinctDayStat = entries.reduce<DistinctDayStat>((acc, entry) => {
      const totalHours = entry.hours.filter(Boolean).length;
      if (acc[entry.date]) {
        acc[entry.date] += totalHours;
      } else {
        acc[entry.date] = totalHours;
      }
      return acc;
    }, {});

    setDistinctDayStat(distinctDayStat);
  }, [entries]);

  useEffect(() => {
    distinctDayStatFun();
  }, [distinctDayStatFun]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchEntries = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/entries`);
      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }
      const data: Entry[] = await response.json();
      setEntries(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async (): Promise<void> => {
    try {
      const formattedDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];

      if (topic === "") {
        alert("Don't be an emptiness machine");
        throw new Error("Topic is required");
      }

      const newEntry: Omit<Entry, "id"> = {
        date: formattedDate,
        topic,
        hours: Array(13).fill(false),
      };
      const response = await fetch(`${API_URL}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });
      if (!response.ok) {
        throw new Error("Failed to add entry");
      }
      setTopic("");
      await fetchEntries();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteEntry = async (entryId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/entries/${entryId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }
      await fetchEntries();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const toggleHour = async (
    entryId: string,
    hourIndex: number
  ): Promise<void> => {
    try {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) {
        throw new Error("Entry not found");
      }
      const updatedHours = [...entry.hours];
      updatedHours[hourIndex] = !updatedHours[hourIndex];

      const response = await fetch(`${API_URL}/entries/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hours: updatedHours }),
      });
      if (!response.ok) {
        throw new Error("Failed to update entry");
      }
      const updatedEntry: Entry = await response.json();
      setEntries(entries.map((e) => (e.id === entryId ? updatedEntry : e)));
      distinctDayStatFun();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) return <div>Loading...</div>;
  if (error){
    console.log(error);
  }

  return (
    <div className="p-4 w-[95vw] m-auto">
      <h1 className="text-2xl font-bold mb-4">Study Tracker</h1>
      <div className="mb-4 flex h-[300px]">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate: Date | undefined) =>
            setDate(newDate || new Date())
          }
          className="rounded-md border  border-slate-300"
        />
        <div className="w-[20%] h-[100%] flex">
          <div className="w-full flex flex-col ml-4">
            <div className="flex mb-4">
              <Input
                type="text"
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTopic(e.target.value)
                }
                placeholder="Enter topic"
                className="flex-grow mr-4  border-slate-300"
              />
              <Button onClick={handleAddEntry}>Add Entry</Button>
            </div>
            <div className="flex flex-col h-full justify-center align-middle border rounded-md border-slate-300 p-4">
              <span className="text-2xl flex justify-center align-middle mb-2 font-mono">
                {formatTime(timer)}
              </span>
              <div className="w-auto flex justify-center align-middle">
                <Button onClick={() => setIsTimerRunning(!isTimerRunning)}>
                  {isTimerRunning ? "Pause" : "Start"}
                </Button>
                <Button
                  onClick={() => {
                    setTimer(0);
                    setIsTimerRunning(false);
                  }}
                  className="ml-4"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="ml-4 w-[30%] p-2 border rounded-md border-slate-300 overflow-y-scroll">
          <Table className="">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Achieved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(distinctDayStat).map(([date, total]) => (
                <TableRow key={date}>
                  <TableCell>{date}</TableCell>
                  <TableCell>{total} hours</TableCell>
                  <TableCell>
                    <Progress value={(total * 100) / 13} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Todo/>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px]">Date</TableHead>
            <TableHead className="w-[200px]">Topic</TableHead>
            {Array.from({ length: 13 }, (_, i) => (
              <TableHead key={i}>{i.toString().padStart(2, "0")}</TableHead>
            ))}
            <TableHead className="w-[100px]">Total</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.date}</TableCell>
              <TableCell>{entry.topic}</TableCell>
              {entry.hours.map((checked, hourIndex) => (
                <TableCell key={hourIndex}>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleHour(entry.id, hourIndex)}
                  />
                </TableCell>
              ))}
              <TableCell>{entry.hours.filter(Boolean).length} hours</TableCell>
              <TableCell>
                <Button onClick={() => handleDeleteEntry(entry.id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StudyTracker;

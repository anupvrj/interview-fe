"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus, MapPin, Briefcase, Code, DollarSign } from "lucide-react";

interface JobPreferences {
  preferredTitles: string[];
  locations: string[];
  experienceBand: string;
  remoteOnly: boolean;
  minSalary?: number;
  keywords: string[];
}

interface JobPreferencesFormProps {
  initialPreferences?: JobPreferences | null;
  onSave: (preferences: JobPreferences) => void;
}

const COMMON_TITLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer",
  "QA Engineer",
  "Mobile Developer",
  "Machine Learning Engineer",
  "Cloud Engineer",
  "System Administrator",
  "Technical Lead",
  "Engineering Manager",
];

const COMMON_LOCATIONS = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Kochi",
  "Remote",
];

const COMMON_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "Docker",
  "Kubernetes",
  "MongoDB",
  "PostgreSQL",
  "Git",
  "REST API",
  "GraphQL",
  "Redis",
  "Microservices",
  "CI/CD",
  "Agile",
  "Scrum",
  "Machine Learning",
];

export function JobPreferencesForm({
  initialPreferences,
  onSave,
}: JobPreferencesFormProps) {
  const [preferences, setPreferences] = useState<JobPreferences>({
    preferredTitles: initialPreferences?.preferredTitles || [],
    locations: initialPreferences?.locations || [],
    experienceBand: initialPreferences?.experienceBand || "0-2",
    remoteOnly: initialPreferences?.remoteOnly || false,
    minSalary: initialPreferences?.minSalary || undefined,
    keywords: initialPreferences?.keywords || [],
  });

  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const addTitle = (title: string) => {
    if (title && !preferences.preferredTitles.includes(title)) {
      setPreferences({
        ...preferences,
        preferredTitles: [...preferences.preferredTitles, title],
      });
      setNewTitle("");
    }
  };

  const removeTitle = (title: string) => {
    setPreferences({
      ...preferences,
      preferredTitles: preferences.preferredTitles.filter((t) => t !== title),
    });
  };

  const addLocation = (location: string) => {
    if (location && !preferences.locations.includes(location)) {
      setPreferences({
        ...preferences,
        locations: [...preferences.locations, location],
      });
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    setPreferences({
      ...preferences,
      locations: preferences.locations.filter((l) => l !== location),
    });
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !preferences.keywords.includes(keyword)) {
      setPreferences({
        ...preferences,
        keywords: [...preferences.keywords, keyword],
      });
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setPreferences({
      ...preferences,
      keywords: preferences.keywords.filter((k) => k !== keyword),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preferences.preferredTitles.length === 0) {
      alert("Please add at least one preferred job title");
      return;
    }
    if (preferences.locations.length === 0) {
      alert("Please add at least one location");
      return;
    }
    onSave(preferences);
  };

  return (
    <Card className="border-2 shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Briefcase className="w-6 h-6" />
          Job Preferences
        </CardTitle>
        <CardDescription>
          Tell us what you're looking for and we'll find the best matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preferred Job Titles */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Preferred Job Titles *
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {preferences.preferredTitles.map((title) => (
                <Badge
                  key={title}
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1"
                >
                  {title}
                  <button
                    type="button"
                    onClick={() => removeTitle(title)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add job title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTitle(newTitle);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTitle(newTitle)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_TITLES.filter(
                (title) => !preferences.preferredTitles.includes(title)
              ).map((title) => (
                <Button
                  key={title}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addTitle(title)}
                  className="text-xs border border-gray-200 hover:bg-blue-50"
                >
                  + {title}
                </Button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Locations *</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {preferences.locations.map((location) => (
                <Badge
                  key={location}
                  variant="secondary"
                  className="bg-green-100 text-green-700 border-green-200 px-3 py-1"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {location}
                  <button
                    type="button"
                    onClick={() => removeLocation(location)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add location..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLocation(newLocation);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addLocation(newLocation)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_LOCATIONS.filter(
                (location) => !preferences.locations.includes(location)
              ).map((location) => (
                <Button
                  key={location}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addLocation(location)}
                  className="text-xs border border-gray-200 hover:bg-green-50"
                >
                  + {location}
                </Button>
              ))}
            </div>
          </div>

          {/* Experience Band */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Experience Level</Label>
            <Select
              value={preferences.experienceBand}
              onValueChange={(value) =>
                setPreferences({ ...preferences, experienceBand: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-2">0-2 years (Fresher/Junior)</SelectItem>
                <SelectItem value="2-5">2-5 years (Mid-level)</SelectItem>
                <SelectItem value="5-10">5-10 years (Senior)</SelectItem>
                <SelectItem value="10+">10+ years (Lead/Principal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Remote Only */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Remote Only</Label>
              <p className="text-sm text-gray-600">
                Only show remote job opportunities
              </p>
            </div>
            <Switch
              checked={preferences.remoteOnly}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, remoteOnly: checked })
              }
            />
          </div>

          {/* Minimum Salary */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Minimum Salary (₹ per year)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="number"
                placeholder="e.g., 500000"
                value={preferences.minSalary || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    minSalary: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                className="pl-10"
              />
            </div>
          </div>

          {/* Keywords/Skills */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Skills & Keywords</Label>
            <p className="text-sm text-gray-600">
              Add technologies and skills you want to work with
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {preferences.keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1"
                >
                  <Code className="w-3 h-3 mr-1" />
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add skill or keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword(newKeyword);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addKeyword(newKeyword)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.filter(
                (skill) => !preferences.keywords.includes(skill)
              ).map((skill) => (
                <Button
                  key={skill}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addKeyword(skill)}
                  className="text-xs border border-gray-200 hover:bg-purple-50"
                >
                  + {skill}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Save Preferences & Find Jobs
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

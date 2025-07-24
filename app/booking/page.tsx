"use client"

import { useEffect, useState, useMemo } from "react"
import { useLanguage } from "@/contexts/language-context"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Search, Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

// Define the structure of a single booking record from the API
interface Booking {
  District_Name_EN: string;
  District_Name_TC: string;
  Venue_Name_EN: string;
  Venue_Name_TC: string;
  Venue_Address_EN: string;
  Venue_Address_TC: string;
  Venue_Phone_No: string;
  Venue_Longitude: string;
  Venue_Latitude: string;
  Facility_Type_Name_EN: string;
  Facility_Type_Name_TC: string;
  Facility_Location_Name_EN: string;
  Facility_Location_Name_TC: string;
  Available_Date: string;
  Session_Start_Time: string;
  Session_End_Time: string;
  Available_Courts: string;
}

type SortKey = keyof Booking;

export default function BookingPage() {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State to hold error messages
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [showAvailable, setShowAvailable] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'Available_Date', direction: 'asc' });

  // Fetch data from our own API route which acts as a proxy
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset error state on new fetch
      try {
        // Fetch from the internal API route instead of the external URL
        const response = await fetch("/api/booking");
        
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        console.error("Error fetching booking data:", err);
        // Set an error message to display to the user
        setError("Failed to fetch data. Please try again later or check the server console for more details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoize the list of unique districts to avoid re-computation
  const districts = useMemo(() => {
    if (loading || !bookings) return [];
    const districtNameKey = language === 'en' ? 'District_Name_EN' : 'District_Name_TC';
    const allDistricts = bookings.map(b => b[districtNameKey]);
    return [...new Set(allDistricts)].sort((a, b) => a.localeCompare(b, language === 'en' ? 'en' : 'zh-HK'));
  }, [bookings, language, loading]);

  // Memoize the filtered and sorted list of bookings
  const filteredAndSortedBookings = useMemo(() => {
    if (loading || !bookings) return [];
    let filtered = bookings.filter(booking => {
      const venueName = language === 'en' ? booking.Venue_Name_EN : booking.Venue_Name_TC;
      const districtName = language === 'en' ? booking.District_Name_EN : booking.District_Name_TC;
      
      const searchTermMatch = venueName.toLowerCase().includes(searchTerm.toLowerCase());
      const districtMatch = !districtFilter || districtFilter === 'all' || districtName === districtFilter;
      const dateMatch = !dateFilter || booking.Available_Date === format(dateFilter, 'yyyy-MM-dd');
      const availableMatch = !showAvailable || parseInt(booking.Available_Courts) > 0;
      
      return searchTermMatch && districtMatch && dateMatch && availableMatch;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [bookings, searchTerm, districtFilter, dateFilter, showAvailable, sortConfig, language, loading]);

  // Function to handle sorting when a table header is clicked
  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("bookingInformation")}</h1>
          <p className="text-gray-600 mt-1">{t("bookingDescription")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("filters")}</CardTitle>
            <CardDescription>{t("filterDescription")}</CardDescription>
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 pt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("searchVenue")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={t("district")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allDistricts")}</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full md:w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : <span>{t("pickDate")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center space-x-2">
                <Checkbox id="show-available" checked={showAvailable} onCheckedChange={(checked) => setShowAvailable(checked as boolean)} />
                <label htmlFor="show-available" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("showAvailableOnly")}
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => requestSort('District_Name_EN')} className="cursor-pointer">{t("district")} <ArrowUpDown className="h-4 w-4 inline ml-2" /></TableHead>
                      <TableHead onClick={() => requestSort('Venue_Name_EN')} className="cursor-pointer">{t("venue")} <ArrowUpDown className="h-4 w-4 inline ml-2" /></TableHead>
                      <TableHead onClick={() => requestSort('Available_Date')} className="cursor-pointer">{t("date")} <ArrowUpDown className="h-4 w-4 inline ml-2" /></TableHead>
                      <TableHead onClick={() => requestSort('Session_Start_Time')} className="cursor-pointer">{t("session")} <ArrowUpDown className="h-4 w-4 inline ml-2" /></TableHead>
                      <TableHead onClick={() => requestSort('Available_Courts')} className="cursor-pointer text-right">{t("availableCourts")} <ArrowUpDown className="h-4 w-4 inline ml-2" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-1/2 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredAndSortedBookings.length > 0 ? (
                      filteredAndSortedBookings.map((booking, index) => (
                        <TableRow key={index}>
                          <TableCell>{language === 'en' ? booking.District_Name_EN : booking.District_Name_TC}</TableCell>
                          <TableCell className="font-medium">{language === 'en' ? booking.Venue_Name_EN : booking.Venue_Name_TC}</TableCell>
                          <TableCell>{booking.Available_Date}</TableCell>
                          <TableCell>{`${booking.Session_Start_Time} - ${booking.Session_End_Time}`}</TableCell>
                          <TableCell className="text-right">{booking.Available_Courts}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t("noResults")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

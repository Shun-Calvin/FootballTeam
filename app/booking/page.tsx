"use client";

import { useState, useEffect, useMemo, useContext } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageContext } from '@/contexts/language-context';
import { translations } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';

// Define the type for the booking data based on the API response
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

/**
 * BookingPage Component
 * * Fetches and displays turf soccer pitch availability from a public API.
 * It includes filters for district, venue, date, and availability,
 * and supports both English and Traditional Chinese languages.
 */
const BookingPage = () => {
  const { language } = useContext(LanguageContext);
  const t = translations[language];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for managing filter values
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
  const [venueFilter, setVenueFilter] = useState<string>('');

  // Effect to fetch data from the API on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // NOTE: The government API may have CORS restrictions. Fetching directly from the browser
        // might fail. A common solution for development is using a CORS proxy.
        // For production, it's recommended to have a backend API route to proxy this request.
        const response = await fetch('https://data.smartplay.lcsd.gov.hk/rest/cms/api/v1/publ/contents/open-data/turf-soccer-pitch/file');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Booking[] = await response.json();
        setBookings(data);
      } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to fetch booking data. The API might be down or blocking requests. Please try again later. Error: ${e.message}`);
        } else {
            setError('An unknown error occurred while fetching data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoized calculation for unique district names to populate the filter dropdown
  const districts = useMemo(() => {
    const districtSet = new Set<string>();
    bookings.forEach(booking => {
      districtSet.add(language === 'en' ? booking.District_Name_EN : booking.District_Name_TC);
    });
    return Array.from(districtSet).sort((a, b) => a.localeCompare(b));
  }, [bookings, language]);

  // Memoized calculation to filter bookings based on active filters
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const districtName = language === 'en' ? booking.District_Name_EN : booking.District_Name_TC;
      const venueName = language === 'en' ? booking.Venue_Name_EN : booking.Venue_Name_TC;

      const districtMatch = districtFilter === 'all' || districtName === districtFilter;
      const dateMatch = !dateFilter || booking.Available_Date === dateFilter;
      const availabilityMatch = !showAvailableOnly || parseInt(booking.Available_Courts, 10) > 0;
      const venueMatch = !venueFilter || venueName.toLowerCase().includes(venueFilter.toLowerCase());

      return districtMatch && dateMatch && availabilityMatch && venueMatch;
    });
  }, [bookings, districtFilter, dateFilter, showAvailableOnly, venueFilter, language]);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t.bookingInformation}</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.filters}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Venue Search Filter */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="venue-search">{t.venueName}</Label>
              <Input
                id="venue-search"
                placeholder={t.searchVenuePlaceholder}
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
              />
            </div>

            {/* District Filter */}
            <div className="flex flex-col space-y-1.5">
               <Label htmlFor="district-filter">{t.district}</Label>
               <Select value={districtFilter} onValueChange={setDistrictFilter}>
                <SelectTrigger id="district-filter">
                  <SelectValue placeholder={t.selectDistrict} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allDistricts}</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="date-filter">{t.date}</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Availability Filter */}
            <div className="flex items-end pb-1.5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available-only"
                  checked={showAvailableOnly}
                  onCheckedChange={(checked) => setShowAvailableOnly(Boolean(checked))}
                />
                <Label htmlFor="available-only" className="whitespace-nowrap">{t.showAvailableOnly}</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && <p className="text-center py-4">{t.loading}</p>}
        {error && <p className="text-red-500 text-center py-4">{error}</p>}
        {!loading && !error && (
          <Card>
            <CardContent className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.district}</TableHead>
                      <TableHead>{t.venueName}</TableHead>
                      <TableHead>{t.address}</TableHead>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.sessionTime}</TableHead>
                      <TableHead className="text-center">{t.availability}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking, index) => (
                        <TableRow key={`${booking.Venue_Name_EN}-${booking.Available_Date}-${booking.Session_Start_Time}-${index}`}>
                          <TableCell>{language === 'en' ? booking.District_Name_EN : booking.District_Name_TC}</TableCell>
                          <TableCell>{language === 'en' ? booking.Venue_Name_EN : booking.Venue_Name_TC}</TableCell>
                          <TableCell>{language === 'en' ? booking.Venue_Address_EN : booking.Venue_Address_TC}</TableCell>
                          <TableCell>{booking.Available_Date}</TableCell>
                          <TableCell>{`${booking.Session_Start_Time} - ${booking.Session_End_Time}`}</TableCell>
                          <TableCell className="text-center">
                            {parseInt(booking.Available_Courts, 10) > 0 ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">{t.available}</Badge>
                            ) : (
                              <Badge variant="destructive">{t.notAvailable}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          {t.noResultsFound}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookingPage;

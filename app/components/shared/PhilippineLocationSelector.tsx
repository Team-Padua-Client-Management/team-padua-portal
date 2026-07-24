'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { REGIONS, PROVINCES, CITIES } from '@/app/lib/constants/philippineLocations';
import SearchableDropdown, { DropdownOption } from './SearchableDropdown';
import { MapPin } from 'lucide-react';

interface PhilippineLocationSelectorProps {
  islandGroup: string;
  setIslandGroup: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  barangay: string;
  setBarangay: (v: string) => void;
  street: string;
  setStreet: (v: string) => void;
  building: string;
  setBuilding: (v: string) => void;
  venue: string;
  setVenue: (v: string) => void;
  zip: string;
  setZip: (v: string) => void;
}

export default function PhilippineLocationSelector({
  islandGroup,
  setIslandGroup,
  region,
  setRegion,
  province,
  setProvince,
  city,
  setCity,
  barangay,
  setBarangay,
  street,
  setStreet,
  building,
  setBuilding,
  venue,
  setVenue,
  zip,
  setZip
}: PhilippineLocationSelectorProps) {
  const [barangayOptions, setBarangayOptions] = useState<DropdownOption[]>([]);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  const [isBarangayInputFallback, setIsBarangayInputFallback] = useState(false);

  // Client-side cache for fetched barangays (City Code -> list of barangays)
  const barangayCache = useRef<Record<string, DropdownOption[]>>({});

  // Constant options for Island Group
  const islandGroupOptions = useMemo<DropdownOption[]>(() => [
    { value: 'Luzon', label: 'Luzon' },
    { value: 'Visayas', label: 'Visayas' },
    { value: 'Mindanao', label: 'Mindanao' }
  ], []);

  // Filtered Regions based on Island Group selection
  const regionOptions = useMemo<DropdownOption[]>(() => {
    let list = REGIONS;
    if (islandGroup) {
      list = list.filter(r => r.islandGroup === islandGroup);
    }
    return list.map(r => ({ value: r.code, label: r.name }));
  }, [islandGroup]);

  // Filtered Provinces based on Region selection
  const provinceOptions = useMemo<DropdownOption[]>(() => {
    let list = PROVINCES;
    if (region) {
      list = list.filter(p => p.regionCode === region);
    } else if (islandGroup) {
      // If region is not selected, but island group is, filter provinces by region codes of that island group
      const activeRegionCodes = REGIONS.filter(r => r.islandGroup === islandGroup).map(r => r.code);
      list = list.filter(p => activeRegionCodes.includes(p.regionCode));
    }
    return list.map(p => ({ value: p.code, label: p.name }));
  }, [islandGroup, region]);

  // Filtered Cities/Municipalities based on Province selection
  const cityOptions = useMemo<DropdownOption[]>(() => {
    let list = CITIES;
    if (province) {
      list = list.filter(c => c.provinceCode === province);
    } else if (region) {
      // Filter by region (via region's provinces)
      const activeProvinceCodes = PROVINCES.filter(p => p.regionCode === region).map(p => p.code);
      list = list.filter(c => activeProvinceCodes.includes(c.provinceCode));
    } else if (islandGroup) {
      // Filter by island group (via regions and provinces)
      const activeRegionCodes = REGIONS.filter(r => r.islandGroup === islandGroup).map(r => r.code);
      const activeProvinceCodes = PROVINCES.filter(p => activeRegionCodes.includes(p.regionCode)).map(p => p.code);
      list = list.filter(c => activeProvinceCodes.includes(c.provinceCode));
    }
    return list.map(c => ({ value: c.code, label: c.name }));
  }, [islandGroup, region, province]);

  interface PsgcBarangay {
    name: string;
    zip_code?: string;
  }

  // Fetch barangays for selected city on the fly
  useEffect(() => {
    if (!city || barangayCache.current[city]) {
      return;
    }

    // Fetch from API
    let active = true;
    const fetchBarangays = async () => {
      setLoadingBarangays(true);
      try {
        const response = await fetch(`https://psgc.cloud/api/v2/cities-municipalities/${city}/barangays`);
        if (!response.ok) throw new Error('API response not ok');
        const json = await response.json();
        
        if (!active) return;
        
        const list: (DropdownOption & { zipCode?: string })[] = (json.data || []).map((b: PsgcBarangay) => ({
          value: b.name, // The user wants the string name saved
          label: b.name,
          zipCode: b.zip_code
        }));
        
        // Sort alphabetically
        list.sort((a, b) => a.label.localeCompare(b.label));

        // Cache the result
        barangayCache.current[city] = list;
        
        setBarangayOptions(list);
        setIsBarangayInputFallback(false);
      } catch (err) {
        console.error('Failed to load barangays dynamically, falling back to manual text input:', err);
        if (active) {
          setIsBarangayInputFallback(true);
        }
      } finally {
        if (active) {
          setLoadingBarangays(false);
        }
      }
    };

    fetchBarangays();
    return () => {
      active = false;
    };
  }, [city]);

  // Dynamic values population when items are chosen
  const handleIslandGroupChange = (val: string) => {
    setIslandGroup(val);
    setRegion('');
    setProvince('');
    setCity('');
    setBarangay('');
    setBarangayOptions([]);
    setIsBarangayInputFallback(false);
  };

  const handleRegionChange = (val: string) => {
    setRegion(val);
    
    // Auto-populate parent Island Group
    const regObj = REGIONS.find(r => r.code === val);
    if (regObj) {
      setIslandGroup(regObj.islandGroup);
    }
    
    // NCR Auto-select Metro Manila province shortcut
    if (val === '1300000000') { // National Capital Region (NCR)
      setProvince('1300000000-prov');
    } else {
      setProvince('');
    }
    
    setCity('');
    setBarangay('');
    setBarangayOptions([]);
    setIsBarangayInputFallback(false);
  };

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    
    // Auto-populate parent Region and Island Group
    const provObj = PROVINCES.find(p => p.code === val);
    if (provObj) {
      setRegion(provObj.regionCode);
      const regObj = REGIONS.find(r => r.code === provObj.regionCode);
      if (regObj) {
        setIslandGroup(regObj.islandGroup);
      }
    }
    
    setCity('');
    setBarangay('');
    setBarangayOptions([]);
    setIsBarangayInputFallback(false);
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    setBarangay('');

    if (!val) {
      setBarangayOptions([]);
      setIsBarangayInputFallback(false);
      return;
    }

    // Check if cached
    if (barangayCache.current[val]) {
      setBarangayOptions(barangayCache.current[val]);
      setIsBarangayInputFallback(false);
    }

    const cityObj = CITIES.find(c => c.code === val);
    if (cityObj) {
      // Auto-populate parent Province, Region, Island Group
      setProvince(cityObj.provinceCode);
      const provObj = PROVINCES.find(p => p.code === cityObj.provinceCode);
      if (provObj) {
        setRegion(provObj.regionCode);
        const regObj = REGIONS.find(r => r.code === provObj.regionCode);
        if (regObj) {
          setIslandGroup(regObj.islandGroup);
        }
      }
      
      // Auto-populate default ZIP code
      if (cityObj.zipCode) {
        setZip(cityObj.zipCode);
      }
    }
  };

  const handleBarangayChange = (val: string) => {
    setBarangay(val);
    
    // Check if the selected barangay has a specific ZIP code in our option list
    const foundOpt = barangayOptions.find(opt => opt.value === val) as (DropdownOption & { zipCode?: string }) | undefined;
    if (foundOpt && foundOpt.zipCode) {
      setZip(foundOpt.zipCode);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Searchable Cascading Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Island Group */}
        <div>
          <SearchableDropdown
            id="onsiteIslandGroup"
            label="Island Group"
            placeholder="Select Island Group"
            searchPlaceholder="Search Luzon, Visayas, Mindanao..."
            options={islandGroupOptions}
            value={islandGroup}
            onChange={handleIslandGroupChange}
          />
        </div>

        {/* Region */}
        <div>
          <SearchableDropdown
            id="onsiteRegion"
            label="Region"
            placeholder={!islandGroup ? "Select Island Group first" : "Select Region"}
            searchPlaceholder="Search Regions..."
            options={regionOptions}
            value={region}
            onChange={handleRegionChange}
            disabled={!islandGroup}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Province */}
        <div>
          <SearchableDropdown
            id="onsiteProvince"
            label="Province"
            placeholder={!region ? "Select Region first" : "Select Province"}
            searchPlaceholder="Search Provinces..."
            options={provinceOptions}
            value={province}
            onChange={handleProvinceChange}
            disabled={!region}
          />
        </div>

        {/* City / Municipality */}
        <div>
          <SearchableDropdown
            id="onsiteCity"
            label="City / Municipality"
            placeholder={!province ? "Select Province first" : "Select City/Municipality"}
            searchPlaceholder="Search Cities and Municipalities..."
            options={cityOptions}
            value={city}
            onChange={handleCityChange}
            disabled={!province}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Barangay (with loading and fallback states) */}
        <div>
          {isBarangayInputFallback ? (
            <div className="flex flex-col gap-1 w-full text-left">
              <label 
                htmlFor="onsiteBarangay" 
                className="text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                Barangay (Offline Fallback)
              </label>
              <input
                id="onsiteBarangay"
                type="text"
                placeholder="Enter Barangay manually"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
              />
            </div>
          ) : (
            <SearchableDropdown
              id="onsiteBarangay"
              label="Barangay"
              placeholder={!city ? "Select City first" : "Select Barangay"}
              searchPlaceholder="Search Barangays..."
              options={barangayOptions}
              value={barangay}
              onChange={handleBarangayChange}
              disabled={!city || loadingBarangays}
              loading={loadingBarangays}
            />
          )}
        </div>

        {/* ZIP Code */}
        <div className="flex flex-col gap-1 w-full text-left">
          <label 
            htmlFor="onsiteZip" 
            className="text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            ZIP Code
          </label>
          <input
            id="onsiteZip"
            type="text"
            placeholder="ZIP Code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Manual Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800/60 pt-4 mt-2">
        {/* Street Address */}
        <div className="flex flex-col gap-1 w-full text-left">
          <label 
            htmlFor="onsiteStreet" 
            className="text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            Street Address
          </label>
          <input
            id="onsiteStreet"
            type="text"
            placeholder="e.g. 123 Rizal Ave"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
          />
        </div>

        {/* Building / Unit */}
        <div className="flex flex-col gap-1 w-full text-left">
          <label 
            htmlFor="onsiteBuilding" 
            className="text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            Building / Unit
          </label>
          <input
            id="onsiteBuilding"
            type="text"
            placeholder="e.g. Rm 501, Sun Life Bldg"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Venue Name */}
        <div className="flex flex-col gap-1 w-full text-left">
          <label 
            htmlFor="onsiteVenue" 
            className="text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            Venue Name
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              id="onsiteVenue"
              type="text"
              placeholder="e.g. Starbucks, Client Residence, Office Lobby"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

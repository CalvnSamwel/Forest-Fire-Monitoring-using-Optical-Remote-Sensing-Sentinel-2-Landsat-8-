# Forest-Fire-Monitoring-using-Optical-Remote-Sensing-Sentinel-2-Landsat-8-

## Using Earth Observations for Pre- and Post-Fire Monitoring
## Introduction
Welcome to the repository for NASA ARSET Training on Using Earth Observations for Pre- and Post-Fire Monitoring! This repository contains JavaScript code designed for detecting and analyzing fire severity using satellite imagery from Landsat 8 and Sentinel-2. The scripts provided here are based on methodologies from the UN Spider NBR Recommended Practices Code and have been tailored for this training session. They allow users to assess burn severity by comparing satellite images from before and after fire events.

This repository is aimed at providing an accessible workflow for environmental scientists, researchers, and students to monitor fire impacts using Google Earth Engine (GEE). The scripts cover essential steps from selecting a study area to processing satellite images and generating burn severity maps.

## Fire Monitoring
### Overview
The fire monitoring workflow involves several key steps:

1. Study Area Selection: Define the region of interest (ROI) using geographic coordinates or predefined boundaries.
2. Date Range Specification: Choose appropriate pre-fire and post-fire timeframes to capture the fire event.
3. Satellite Platform Selection: Choose between Landsat 8 and Sentinel-2 imagery depending on your spatial and temporal needs.
4. Cloud and Snow Masking: Apply masking techniques to remove clouds and snow from the images.
5. Mosaic and Clip Images: Combine and clip images to the selected study area.
6. NBR Calculation: Calculate the Normalized Burn Ratio (NBR) for both pre-fire and post-fire images.
7. dNBR Calculation: Determine the difference in NBR (dNBR) to assess burn severity.
8. Visualization: Display various layers such as true color imagery, NBR, and dNBR on the map.
9. Burned Area Calculation: Quantify the burned area by severity class.
10. Export Results: Export the dNBR image and burned area statistics for further analysis.

### Code Overview
The scripts are divided into several sections:

1. Study Area Selection: Users can select a study area by defining a geometry or using predefined country boundaries.
2. Time Frame Specification: Pre-fire and post-fire date ranges are specified to retrieve satellite images from the desired periods.
3. Satellite Platform Selection: Users can choose between Landsat 8 or Sentinel-2 based on their specific requirements.
4. Cloud and Snow Masking: Different masking techniques are applied depending on the selected satellite platform.
5. Image Processing: Images are mosaicked and clipped to the study area, followed by the calculation of NBR and dNBR.
6. Burn Severity Visualization: Layers are added to the map for visual interpretation of burn severity.
7. Burned Area Calculation: The extent of burned areas is calculated, and the results are categorized into severity classes.
8. Export: The final dNBR image and burned area statistics are exported for further use.

## Getting Started
To use these scripts:

1. Clone or Download: Clone or download this repository to your local machine.
2. Google Earth Engine: Sign in to your Google Earth Engine account.
3. Code Editor: Open the Google Earth Engine Code Editor and create a new script.
4. Paste Code: Copy and paste the code from this repository into your new script.
5. Modify Parameters: Adjust the study area, date range, and satellite platform as needed.
6. Run the Script: Execute the script to process the satellite imagery and visualize the results.
7. Export Data: Use the export functionality to save the results to your Google Drive.


## Acknowledgments
This script was adopted by Calvin Samwel Swai with modifications by Amber McCullum (NASA ARSET) and reviews by Britnay Beaudry (NASA DEVELOP). Special thanks to the UN Spider team for their recommended practices and the Google Earth Engine team for providing the tools necessary for this analysis.

Happy fire monitoring! 🔥

## Resources
For more information on NASA ARSET training, please visit the NASA ARSET Training Website.

## Notes
This script is highly adaptable for different regions and fire events. Make sure to modify the study area and date range to suit your specific use case.
If running the script for a large area like an entire country, consider dividing the region into smaller sections to avoid exceeding GEE's processing limits.

# HELIOS - HEterogeneous Large Information Observation System

## Description
HELIOS is a data visualization tool that can be used for explorative data analysis of big data. It is OS independent 
and with its client server architecture it can be run in conjunction with large data storage 
facilities or simply locally on one machine for portability. 

### Architecture
![Overview of HELIOS Architecture](Doc/schematic_architecture.JPG)
## License
HELIOS is publish under the [GPL version 3](http://opensource.org/licenses/GPL-3.0). If you use, change or replicate HELIOS do so according to the rules of the
 GPL.

## Features

* Multi Fileformat Support
* Client-Server Architecture(flexible deployment)
* OS Independent
* Modularity / Versatility
* Expansible Architecture

### Visualization
 * Parallel Coordinates
 * Graph
    * Directed
    * Undirected
    
## Contribute!
If you want to contribute you should read the [Guide](vis_implementation_guide.md) for creating new visualization types.

## Tasks

### Documentation
- [x] Readme File
- [ ] Write extensive comments
- [ ] Benchmarks
    - [ ] Draw Benchmark
    - [ ] Data Loading Benchmark

### Data Loading
#### Datatype Support
- [x] *.csv
- [ ] *.xml
- [ ] *.pcap
- [ ] ...

#### Server
- [ ] Decontaminate Server PHP Code
    - [ ] Remove dead code
    - [ ] Refactor

### UI
- [x] Tool Setup Wizard
- [x] Side Panel Settings

### Visualizations
- [x] Parallel Coordinates
    - [ ] Brushing
        - [x] Selection
        - [x] Axis Movement
        - [x] Multi Vis. Brushing
- [x] Graph
    - [ ] Brushing
        - [x] Selection
        - [x] Dragging
        - [x] Multi Vis. Brushing
    - [ ] Sidepanel Settings
        - [x] Single Node Hiding / Dimming
        - [ ] Forcefield Parameter Changes
    
## Tools & Libraries
Software used by this project includes D3JS, Bootstrap and JQuery. These projects may use different licenses and 
therefore different policies from the [GPLv3](http://opensource.org/licenses/GPL-3.0) may apply. Please check the respective project websites for the licenses 
that may apply. 
* [D3.js](https://d3js.org/)
* [Bootstrap](https://getbootstrap.com/)
* [Jquery](https://jquery.com/)

# Warranty
See details of the GPL version 3.

HELIOS &#169; 2016 [Matthias Gusenbauer](https://www.palladion.it)
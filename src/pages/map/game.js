import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import data from '../../../public/cities.json';
import { calculateDistance } from '@/distanceUtils'
const containerStyle = {
  width: '800px',
  height: '800px'
};

const center = {
  lat: 51.67,
  lng: 14.57
};

/* 
  { score } , { gameState }
  { currentcity }
  { locations }
*/
export default function GamePage () {
  
    return (
      <GameProvider>
        <LoadScript
          googleMapsApiKey="AIzaSyDsawt-BHQDJx7LqtwabE1aLtXOpbEQphY">
          <div className="flex flex-col"> 
            <Score />
            <GameBody>
              <div className="flex">
                <Map />
                <Summary />
              </div>
            </GameBody>
          </div>
        </LoadScript>
      </GameProvider>
    )
}

const GameContext = createContext();
  let i = 0
  const GameProvider = (props) => {
  const {
    children
  } = props

  const citiesRef = useRef(data.cities) 
  const [score, setScore] = useState(1500)
  const [gameState, setGameState] = useState("idle")
  const [currentCity, setCurrentCity] = useState(null)
  const [locations, setLocations] = useState([])
  const [reset, setReset] = useState(false)
  
  useEffect(() => {
    const nextCity = getNextCity()

    setCurrentCity(nextCity)
  } , [])

  const getNextCity = () => {
    return data.cities[i++]
  }
  
  const onMark = (location) => {

    const lat = location.latLng.lat()
    const lng = location.latLng.lng()

    const newLocation = {lat,lng,id:uuid()}

    const distance = calculateDistance(currentCity.position,newLocation)

    let newScore = score,
      newGameState = gameState,
      newNextCity = currentCity

    if(distance > 50)
    {
      newLocation.isCorrect=false
      if(newScore - distance <= 0)
        {
          newGameState = "ended"
          setReset(true)
        }
      newScore = newScore - distance
    }
    else{
      newLocation.isCorrect=true
      newNextCity= getNextCity()
    }

    newLocation.distance = distance
    setLocations((currentLocations) => [...currentLocations,newLocation])
    setCurrentCity(newNextCity)
    setScore(newScore)
    setGameState(newGameState)
  }

  const onReset = () => {
    const nextCity = getNextCity()

    setCurrentCity(nextCity)
    setScore(1500)
    setGameState("idle")
    setReset(false)
    setLocations([])
  }

  const context = {
    data : {score, gameState, currentCity, locations, reset},
    api : {onMark, onReset}
  }

  return (
    <GameContext.Provider value={context}>
      {children}
    </GameContext.Provider>
  );
}

const useGameContext = () => {
  const context = useContext(GameContext)

  return context;
}

const Map = () => {
  const {api:{onMark}} = useGameContext()

  return (
    <GoogleMap
          mapContainerStyle={containerStyle}
          streetViewControl={false}
          center={center}
          zoom={5} 
          onClick={onMark}
          suppressMarkers={true}
          options= {{ styles:defaultOptions.styles }}
          >
      <Markers />
    </GoogleMap>
  );
}


const Markers = () => {
  const locations = []
  return (
    <>
      {locations.map((address, index) => {
        return (
          <Marker
            key={uuid()}
            title={address.address}
            position={{ lat: address.lat, lng: address.lng }}
            icon={{
              url: MarkerHelper.getIcon(index),
              scaledSize: MarkerHelper.getSize(),
              origin: MarkerHelper.getOrigin(),
              anchor: MarkerHelper.getAnchor(),
            }}
          />
        );
      })}
    </>
  );
};

const MarkerHelper = {
  markerSize: 30,
  getIcon: (index) =>
    "http://maps.google.com/mapfiles/kml/paddle/" +
    TextHelper.getLetter(index) +
    ".png",
  getSize: () =>
    new window.google.maps.Size(
      MarkerHelper.markerSize,
      MarkerHelper.markerSize
    ),
  getOrigin: () => new window.google.maps.Point(0, 0),
  getAnchor: () =>
    new window.google.maps.Point(
      MarkerHelper.markerSize / 2,
      MarkerHelper.markerSize / 2
    ),
};

const TextHelper = {
  getLetter: (index) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return alphabet.charAt(index);
  },
};

const Summary = () => {
  return (
    <div className="flex flex-col grow">
      <CurrentCity />
      <Locations />
    </div>
  );
}

const CurrentCity = () => {
  const {data:{currentCity}} = useGameContext()

  if (currentCity)
  {    
    return (
      <div className="justify-center items-center text-center mt-5 font-bold">
        <span>Please try to locate {currentCity.name}</span> 
      </div>
    )
  }
  
  return (
    <></>
  )
}

const Locations = () => {
  const {data:{locations}} = useGameContext()
  return (
    <div className="flex flex-col p-4 mt-5">
      {locations.map((location) => (
        <div className={`shadow-md p-4 ${location.isCorrect ? "bg-green-400" : "bg-red-400"}`} key={location.id}>
          Distance of your chosen location to the target is : {location.distance} km {( location.distance <= 50 ? "correct" : "incorrect" )}
        </div>
      ))}
    </div>
  );
}

const Score = () => {
  const {data:{score}} = useGameContext()
  const {api:{onReset}} = useGameContext()

  if(score.toFixed(0) <= 0)
  {
    return(
    <div className="mt-10 flex justify-center items-center flex-col w-72 rounded-lg shadow-xl h-auto p-2 w-full">
      <h3  className=" justify-center items-center text-base mt-2 mx-4 text-gray-400 font-semibold text-center">
        map game has ended Let's reset the game 
      </h3>
      <button className="justify-center items-center  text-center bg-blue-400 text-black block max-w-[80px]" onClick={onReset}>RESET</button>
    </div>
    );
  }
  return (
    <div className="mt-10 flex justify-center items-center flex-col w-72 rounded-lg shadow-xl h-auto p-2 w-full">
      <h3 className="text-xl mt-2 mx-4 text-gray-700 font-semibold text-center">
        your current score is {score.toFixed(0)}
      </h3>
    </div>

  );
}

const GameBody = (props) => {
  
  const {data:{gameState}} = useGameContext()

  if(gameState !== "ended")
  {
    return props.children;
  }
  
}

let defaultOptions = {
  scrollwheel: false,
  styles: [
    {
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#c0af16"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry",
      "stylers": [
        {
          "visibility": "on"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#c0af16"
        },
        {
          "visibility": "on"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "on"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.neighborhood",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "landscape",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.local",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    }
  ],
};
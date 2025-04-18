# metacritic-ts
[![GitHub](https://img.shields.io/github/license/Deadlock-too/metacritic-ts)](https://github.com/Deadlock-too/metacritic-ts)
[![npm](https://img.shields.io/npm/v/metacritic-ts)](https://www.npmjs.com/package/metacritic-ts)
[![npm](https://img.shields.io/npm/dt/metacritic-ts)](https://www.npmjs.com/package/metacritic-ts)

A TypeScript library for interacting with the Metacritic website API. Easily search for games, movies and tv shows and retrieve their ratings Metacritic rating.

This library takes inspiration from another library of mine [howlongtobeat-ts](https://github.com/Deadlock-too/howlongtobeat-ts).

> ⚠️ **Disclaimer:** This library is not an official API and is not affiliated nor endorsed with Metacritic.com or Fandom Inc 
> in any way. Please use this library responsibly and do not abuse or overload the Metacritic servers. Use at your own risk.

## Features 

- Search for games, movies and tv shows on Metacritic
- Retrieve rating data for games, movies and tv shows
- TypeScript support with full type definitions

## Installation

Install the library via npm:
```bash
npm install metacritic-ts
```

## Usage

```typescript
import { MetacriticService, RecordType } from 'metacritic-ts';

/**
 * Example usage of the MetacriticService to search for a keyword
 */
async function search() {
    const metacriticService = new MetacriticService();
    
    // Search for a game
    const results = await metacriticService.search('The Last of Us');
    
    // This will result in a list of games, movies or tv shows
    if (results) {
        console.log('Search results:', results);
    }
}

/**
 * Example usage of the MetacriticService to get the details of a game
 */
async function getDetail() {
    const metacriticService = new MetacriticService();
    
    // Get the details of a game
    const details = await metacriticService.getDetail('The Last of Us Part II', RecordType.GAME);

    // This will result in the details of the game, including the rating    
    if (details) {
        console.log('Game details:', details);
    }
}

await search();
await getDetails();
```

## API

### `MetacriticService`

The main service class for interacting with the Metacritic website.

#### Constructor

- `constructor(minSimilarity: number = 0.5)`: Creates an instance of the MetacriticService class.
    - `minSimilarity`: Optional parameter to set the minimum similarity threshold for search results to not be filtered out (Default: 0.5).

#### Methods
- `async search(searchKey: string): Promise<MetacriticSearchEntry[]>`: Searches for games, movies or tv shows matching the provided search key.
    - `searchKey`: The title to search for
    - `recordType`: Optional record type to adjust search behavior, it hasn't a default value and will search for all types.
    - `sortBySimilarity`: Optional boolean to sort the results by similarity to the search key (Default: true). If set to false, the results will leave to the order returned by the Metacritic API.

- `async getDetail(title: string, recordType: RecordType): Promise<MetacriticEntry | null>`: Retrieves the details of a game, movie or tv show matching the provided title.
    - `title`: The title to search for
    - `recordType`: The type of record to retrieve (game, movie or tv show)
    - `sortBySimilarity`: Optional boolean to sort the results by similarity to the search key (Default: true). Pay attention that this parameter is very important for the `getDetail` method, if set to false, the results will leave to the order returned by the Metacritic API and the first result may not be the one you are looking for.

### `RecordType`
An enum representing the type of record to retrieve.
- `TVShow`: Record type for TV shows
- `Movie`: Record type for movies
- `Game`: Record type for games

### `MetacriticSearchEntry`
An interface representing a search entry returned by the MetacriticService.
- `id`: The unique identifier for the record.
- `recordType`: The type of record (game, movie or tv show).
- `title`: The title of the record.
- `slug`: The slug of the record.
- `must`: A boolean indicating if the record is a must-see, must-play or must-watch.
- `criticScore`: The critic score of the record.
- `similarity`: A computed value that indicates how similar the record is to the search term.

### `MetacriticEntry`
An interface representing a record entry returned by the MetacriticService.
- `id`: The unique identifier for the record.
- `recordType`: The type of record (game, movie or tv show).
- `title`: The title of the record.
- `slug`: The slug of the record.
- `must`: A boolean indicating if the record is a must-see, must-play or must-watch.
- `criticScore`:
  - `score`: The critic score of the record.
  - `maxScore`: The maximum critic score.
  - `count`: The number of critic reviews.
  - `sentiment`: The sentiment of the critic reviews.
  - `count`:
    - `positive`: The number of positive reviews.
    - `negative`: The number of negative reviews.
    - `neutral`: The number of neutral reviews.
    - `total`: The total number of reviews.
- `userScore`:
  - `score`: The user score of the record.
  - `maxScore`: The maximum user score.
  - `count`: The number of user reviews.
  - `sentiment`: The sentiment of the user reviews.
  - `count`:
    - `positive`: The number of positive reviews.
    - `negative`: The number of negative reviews.
    - `neutral`: The number of neutral reviews.
    - `total`: The total number of reviews.

## Development

### Prerequisites

- Node.js
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/Deadlock-too/metacritic-ts.git

# Install dependencies
cd metacritic-ts
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Issues, Questions & Discussions
If you found a bug, report it as soon as possible creating an [issue](https://github.com/Deadlock-too/metacritic-ts/issues/new), the code is not perfect for sure, and I will be happy to fix it.
If you need any new feature, or want to discuss the current implementation/features, consider opening a [discussion](https://github.com/Deadlock-too/metacritic-ts/discussions/) or even propose a change with a [Pull Request](https://github.com/Deadlock-too/metacritic-ts/pulls).

## License
This project is licensed under the MIT License - see the <a href="https://github.com/Deadlock-too/metacritic-ts/blob/main/LICENSE" target="_blank">LICENSE</a> file for details.

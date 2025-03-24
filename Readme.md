# Cricbuzz Scraper

Modern Node.js module for fetching live cricket scores from Cricbuzz.

## Installation

```bash
npm install cricbuzz-scraper
```

## Quick Start

```javascript
const cricbuzz = require('cricbuzz-scraper');

// Fetch recent matches
cricbuzz.getRecentMatches()
  .then(matches => console.log(matches))
  .catch(err => console.error(err));

// Fetch specific match score
cricbuzz.getLiveScore('12345')
  .then(score => console.log(score))
  .catch(err => console.error(err));
```

## API Reference

### `getRecentMatches()`

```javascript
cricbuzz.getRecentMatches()
  .then(matches => console.log(matches));
```

- Returns: `Promise<Array<Object>>`
- Fetches list of recent and live matches

### `getLiveScore(matchId, options)`

```javascript
cricbuzz.getLiveScore('12345', { useCache: true })
  .then(score => console.log(score));
```

- Parameters:
  - `matchId`: `String` - Required match ID
  - `options`: `Object`
    - `useCache`: `Boolean` - Default: `true`
- Returns: `Promise<Object>`

#### Score Object Structure

```javascript
{
  id: String,
  type: String,
  series: String,
  status: String,
  state: String,
  startTime: String, // ISO format
  venue: {
    name: String,
    location: String
  },
  lastUpdated: Date,
  teams: {
    [teamId]: {
      name: String,
      shortName: String
    }
  },
  score: {
    runRate: String,
    target: Number|null,
    detail: {
      currentInnings: Number,
      batting: {
        score: Number,
        overs: String,
        wickets: Number
      },
      bowling: {
        score: Number,
        overs: String,
        wickets: Number
      }
    },
    timestamp: Date,
    partnership: String,
    batsmen: Array<Object>,
    bowlers: Array<Object>,
    lastBallDetail: {
      batsman: Object,
      bowler: Object,
      events: Array,
      commentary: String,
      score: String|Number
    }
  }
}
```

## Examples

### Get Multiple Match Details

```javascript
const cricbuzz = require('cricbuzz-scraper');

async function getMatches() {
  try {
    const matches = await cricbuzz.getRecentMatches();
    console.log('Recent Matches:', matches);
    
    const matchDetails = await cricbuzz.getLiveScore(matches[0].id);
    console.log('Match Details:', matchDetails);
  } catch (error) {
    console.error('Error:', error);
  }
}

getMatches();
```

### Real-time Score Updates

```javascript
const cricbuzz = require('cricbuzz-scraper');

async function monitorMatch(matchId) {
  setInterval(async () => {
    try {
      const score = await cricbuzz.getLiveScore(matchId);
      console.log(`Score Update: ${score.score.detail.batting.score}/${score.score.detail.batting.wickets}`);
    } catch (error) {
      console.error('Error:', error);
    }
  }, 30000); // Update every 30 seconds
}

monitorMatch('12345');
```

## Requirements

- Node.js 12.x or higher
- NPM 6.x or higher

## License

MIT

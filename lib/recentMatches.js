const rp = require('request-promise');
const cheerio = require('cheerio');
const getLiveScore = require('./liveScore');

const getRecentMatches = () => {
    return rp.get('http://www.cricbuzz.com', { timeout: 5000 })
        .then(cricbuzzHome => {
            const home = cheerio.load(cricbuzzHome);
            return getLiveMatchesId(home);
        })
        .then(liveMatchIds => {
            if (liveMatchIds.length) {
                const promises = liveMatchIds.map(matchId => 
                    getLiveScore(matchId).catch(err => ({ error: err.message, matchId }))
                );
                return Promise.all(promises);
            }
            return [];
        })
        .catch(err => {
            throw new Error(`Failed to fetch recent matches: ${err.message}`);
        });
}

const getLiveMatchesId = ($) => {
    const d1 = $('#hm-scag-mtch-blk').children()[0]?.children[0];
    if (!d1?.children) return [];
    
    return d1.children.map(matchObj => {
        const link = matchObj.children[0]?.attribs?.href;
        return link ? link.split('/')[2] : null;
    }).filter(Boolean);
}

module.exports = getRecentMatches;

const rp = require('request-promise');
const _ = require('lodash');

class CricketScore {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30000;
    }

    async getLiveScore(id, options = { useCache: true }) {
        try {
            if (options.useCache && this.cache.has(id)) {
                const cached = this.cache.get(id);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const matchInfo = await rp.get(`https://www.cricbuzz.com/match-api/${id}/commentary.json`, {
                timeout: 5000,
                headers: { 'User-Agent': 'cricbuzz-scraper/1.0.0' }
            }).then(JSON.parse);

            if (!matchInfo.id) {
                throw new Error('No match found');
            }

            const output = this.formatMatchData(matchInfo);
            
            if (options.useCache) {
                this.cache.set(id, {
                    data: output,
                    timestamp: Date.now()
                });
            }

            return output;
        } catch (e) {
            throw new Error(`Failed to fetch live score: ${e.message}`);
        }
    }

    formatMatchData(matchInfo) {
        const output = {
            id: matchInfo.id,
            type: matchInfo.type,
            series: matchInfo.series.name,
            status: matchInfo.status,
            state: matchInfo.state,
            startTime: new Date(matchInfo.start_time).toISOString(),
            venue: { 
                name: matchInfo.venue.name, 
                location: matchInfo.venue.location 
            },
            lastUpdated: new Date()
        };

        if (output.state !== 'preview') {
            const players = matchInfo.players;
            output.teams = this.getTeamInfo(matchInfo.team1, matchInfo.team2);
            output.score = this.getEnhancedScore(matchInfo.score, output.teams, players);
        }

        return output;
    }

    getEnhancedScore(score, teams, players) {
        const enhancedScore = {
            runRate: score?.crr || 'N/A',
            target: score?.target || null,
            detail: this.getScoreDetails(score, teams),
            timestamp: new Date()
        };

        if (score && score.batsman) {
            enhancedScore.partnership = score.prtshp || 'N/A';
            enhancedScore.batsmen = this.getPlayerInfo(score.batsman, players);
            enhancedScore.bowlers = this.getPlayerInfo(score.bowler, players);
            enhancedScore.lastBallDetail = this.getLastBallDetail(
                score.comm_lines, 
                players, 
                (score.prev_overs || '').trim(), 
                enhancedScore.detail.batting.overs
            );
        }

        return enhancedScore;
    }

    getLastBallDetail(comm_lines, players, prevOvers, over) {
        if(!over.includes(".")) {
            over = parseInt(over, 10);
            over = `${over-1}.6`
        }
        const lassBallCommentaryDetails = _.find(comm_lines, {
            o_no: over
        });
        let lassBallDetail = {};
        if (lassBallCommentaryDetails) {
             lassBallDetail = {
                batsman: this.getPlayerInfo(lassBallCommentaryDetails.batsman, players),
                bowler: this.getPlayerInfo(lassBallCommentaryDetails.bowler, players),
                events: lassBallCommentaryDetails.all_evt,
                commentary : lassBallCommentaryDetails.comm,
                score: this.getLastBallStatus(prevOvers),
            };   
        }
        return lassBallDetail;
    }

    getLastBallStatus(prevOvers) {
        const ballArray = (prevOvers || "").split(' ');
        const lastBall = ballArray.length ? ballArray[ballArray.length - 1] === '|' ? ballArray[ballArray.length - 2] || null : ballArray[ballArray.length - 1] : "-";
        return lastBall === '.' ? 0 : lastBall;
    }

    getPlayerInfo(playerArray, players) {
        return playerArray.map(player => {
            const playerDetail = this.getPlayerObj(player.id, players);
            player.name = playerDetail.f_name;
            player.shortName = playerDetail.name;
            return player;
        });
    }

    getPlayerObj(id, players) {
        return _.find(players, { id });
    }

    getTeamInfo(team1, team2) {
        const teams = {};
        const assignTeamToObject = (team) => {
            teams[team.id] = {
                name: team.name,
                shortName: team.s_name,
            }
        }
        assignTeamToObject(team1);
        assignTeamToObject(team2);
        return teams;   
    }

    getScoreDetails(score, teams) {
        const scoreDetail = {
            currentInnings: 1
        }
        
        const getInningsDetail = (innings) => {
            const inningsDetail = teams[innings.id];
            const inningsInfo = innings.innings[0];
            inningsDetail.score = inningsInfo.score;
            inningsDetail.overs = inningsInfo.overs;
            inningsDetail.wickets = inningsInfo.wkts;
            return inningsDetail;
        }

        scoreDetail.batting = getInningsDetail(score.batting);
        
        if (score.bowling) {
            scoreDetail.currentInnings = 2;
            scoreDetail.bowling = getInningsDetail(score.bowling);
        }

        return scoreDetail;
    }
}

module.exports = new CricketScore();

const APP_TIMEZONE = 'Europe/Istanbul';
const DAILY_CHALLENGE_TECH_OPTIONS = ['auto', 'javascript', 'react', 'angular', 'vue', 'html', 'css'];
const DAILY_CHALLENGE_TECH_PRIORITY = ['javascript', 'react', 'angular', 'vue', 'html', 'css'];

const DAILY_CHALLENGE_RECENT_WINDOW_DAYS = 10;
const WEEKLY_GOAL_DEFAULT_TARGET = 10;
const WEEKLY_GOAL_MIN_TARGET = 3;
const WEEKLY_GOAL_MAX_TARGET = 50;
const WEEKLY_GOAL_BONUS_XP = 50;
const LEVEL_STEP_XP = 200;

const SOLVE_KINDS = new Set(['coding', 'trivia', 'debug']);

const DIFFICULTY_XP = {
  easy: 10,
  intermediate: 20,
  hard: 30,
};

module.exports = {
  APP_TIMEZONE,
  DAILY_CHALLENGE_TECH_OPTIONS,
  DAILY_CHALLENGE_TECH_PRIORITY,
  DAILY_CHALLENGE_RECENT_WINDOW_DAYS,
  WEEKLY_GOAL_DEFAULT_TARGET,
  WEEKLY_GOAL_MIN_TARGET,
  WEEKLY_GOAL_MAX_TARGET,
  WEEKLY_GOAL_BONUS_XP,
  LEVEL_STEP_XP,
  SOLVE_KINDS,
  DIFFICULTY_XP,
};

# Bull reloadable config

This libray allow you to manage a [bull](https://github.com/OptimalBits/bull/) configuration as some code.
Each time your application is redeployed, you can reload the configuration of the jobs.

This is usefulll for delay/cron or schedulded jobs 

## Usage

```bash
npm i bull-reloadable-config
```


In your projet, reload your config this way : 

```ts
const userConfigs = [
    {
        data: { _version: '1.0.4', type: 'logout', logoutUserId: 'userId' },
        opts: { jobId, delay: 60_000 },
    },
     {
        data: { _version: '1.0.4', type: 'logout', logoutUserId: 'otherUserId' },
        opts: { jobId, delay: 3600_000 },
    },
];
await reloadConfig('userAutoLogQueue', queueOptions, configs);

const userConfigs = [
    {
        data: { _version: '1.0.4', ...paymentsData },
        opts: { jobId: 'recurrentPaiement147678', repeat: {cron: '15 3 * * *'} },
    },
];

await reloadConfig('paymentsQueue', queueOptions, configs);
```

## The reloadConfig method

| param  |  description | required  |   default |
|---|---|---|---|
| queue name  |  The bull queue name | true  |  - |
| queue options  |  The bull queue options| true  |  - |
| configs  |  An array of config objects (see below)  |  true | - |
| deleteExtraJobs  |  If true, the job that exist in the queue but not in configs will be deleted | false  |  false |
| concurrency  |  The number of concurrent operations on the queues (only for updates and remove) | false  |  5000 |

## The Config object

| key  |  description | default value  |   
|---|---|---|
| data.version  |  The semver version of the job config | -  |  
| opts.jobId  |  A uniq identifier for the job | -  |  
| name  |  The job name | undefined  |  
| force  |  If true, the job will be reloaded even if its new version is lower that the current one | false  |  

## Performance consideration

This lib is tested with huge amount of jobs (10,000 in the tests) in less than a dozen of seconds. 

## TODO

* [ ] Allow to inject a redis client

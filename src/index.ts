/* eslint-disable no-underscore-dangle */
import type Bull from 'bull';
import Semver from 'semver';
// eslint-disable-next-line no-duplicate-imports
import Queue from 'bull';
import pMap from 'p-map';

export interface BullConfig {
  /**
   * If true, the config is reloaded even if it is older than the current one
   */
  force?: boolean;
  /**
   * The job name
   */
  name?: string;
  /**
   * @field _version: a semver version of this job
   */
  data: { _version: string };
  opts: { jobId: Bull.JobId } & Bull.JobOptions;
}

const RELOADABLE_STATUSES: Bull.JobStatus[] = ['waiting', 'delayed', 'active'];

function sameConfig(config: BullConfig, job: Bull.Job) {
  for (const key in config.opts) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore,@typescript-eslint/ban-ts-comment
    //@ts-ignore to fix
    if (job.opts[key] !== config.opts[key]) {
      return false;
    }
  }
  return true;
}

/**
 *
 * @param queueName the queue name
 * @param queueOptions the queue options
 * @param configs all the queue jobs
 * @param deleteExtraJobs if true the jobs of the queue that does not exist in the config will be deleted. If a job has no _id it won't be deleted.
 * @param concurrency How many job can be handled concurrently
 */
export async function reloadConfig(
  queueName: string,
  queueOptions: Bull.QueueOptions,
  configs: BullConfig[],
  deleteExtraJobs = false,
  concurrency = 5000,
) {
  const configsById = configs.reduce<{ [id: string]: BullConfig }>(
    (acc, entry) => {
      if (!Semver.valid(entry.data._version)) {
        throw new SyntaxError(`${entry.data._version} is not a valid semver`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!entry.opts || !entry.opts.jobId) {
        throw new SyntaxError('Each job need an _id');
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (acc[entry.opts.jobId]) {
        throw new SyntaxError(
          `Each job need an uniq _id found ${entry.opts.jobId} twice`,
        );
      }
      acc[entry.opts.jobId] = entry;
      return acc;
    },
    {},
  );
  const queue = new Queue<BullConfig['data']>(queueName, queueOptions);
  const jobsToCreate: BullConfig[] = [];

  const jobs: Bull.Job<BullConfig['data']>[] = await queue.getJobs(
    RELOADABLE_STATUSES,
  );

  const maintenancePromises: (() => Promise<unknown>)[] = [];

  configs.forEach(config => {
    const existingJob = jobs.find(job => job.id === config.opts.jobId);
    if (existingJob) {
      if (
        Semver.gt(config.data._version, existingJob.data._version) ||
        config.force
      ) {
        if (sameConfig(config, existingJob)) {
          maintenancePromises.push(() => existingJob.update(config.data));
        } else {
          maintenancePromises.push(() => existingJob.remove());
          jobsToCreate.push(config);
        }
      }
    } else {
      jobsToCreate.push(config);
    }
  });

  if (deleteExtraJobs) {
    jobs.forEach(job => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!configsById[job.id]) {
        maintenancePromises.push(() => job.remove());
      }
    });
  }
  await pMap(maintenancePromises, t => t(), { concurrency });
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore,@typescript-eslint/ban-ts-comment
  //@ts-ignore does not exists in the types
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await queue.addBulk(jobsToCreate);

  await queue.close();
}

import Promise from 'bluebird';
import Travis  from 'travis-ci';
import _       from 'lodash';
import chalk   from 'chalk';


/**
 * @param {Mozaik} mozaik
 * @returns {Function}
 */
const client = mozaik => {
    const travis = new Travis({
        version: '2.0.0'
    });

    return {
        /**
         * Fetch repository info.
         *
         * @param {object} params
         * @param {string} params.owner
         * @param {string} params.repository
         * @returns {Promise}
         */
        repository({ owner, repository }) {
            const def = Promise.defer();

            mozaik.logger.info(chalk.yellow(`[travis] calling repository: ${owner}/${repository}`));

            travis.repos(owner, repository).get((err, res) => {
                if (err) {
                    return def.reject(err);
                }

                def.resolve(res.repo);
            });

            return def.promise;
        },
        /**
         * Fetch latest build status.
         *
         * @param {object} params
         * @param {string} params.owner
         * @param {string} params.repository
         * @param {string} params.branch
         * @returns {Promise}
         */
        buildStatus({ owner, repository, branch }) {
            const def = Promise.defer();

            mozaik.logger.info(chalk.yellow(`[travis] calling buildStatus: ${owner}/${repository} branch ${branch}`));

            travis.repos(owner, repository).branches(branch).get((err, res) => {
                if (err) {
                    return def.reject(err);
                }
                const build = res.branch;
                const buildStatus = (state) => {
                    switch (state) {
                        case 'created' : return 'building';
                        case 'started' : return 'building';
                        case 'passed'  : return 'success';
                        case 'failed'  : return 'failure';
                        case 'errored' : return 'failure';
                        case 'canceled': return 'aborted';
                        default        : return 'unknown';
                    }
                };
                travis.repos(owner, repository).builds.get((err, res) => {
                    if (err) {
                        return def.reject(err);
                    }

                    res.builds.forEach(build => {
                        const commit = _.find(res.commits, { id: build.commit_id });
                        if (commit) {
                            build.commit = commit;
                        }
                    });
                    const previousBuild = _.find(res.builds, (b) => {
                        return b.commit.branch == branch && (b.state == 'passed' || b.state == 'failed' || b.state == 'errored');
                    }) || {
                        state: 'not_found'
                    };

                    def.resolve({
                        id             : build.id,
                        number         : build.number,
                        status         : buildStatus(build.state),
                        previous_status: buildStatus(previousBuild.state),
                        timestamp      : build.finished_at || build.started_at
                    });
                });
            });

            return def.promise;
        },

        /**
         * Fetch repository build history.
         *
         * @param {object} params
         * @param {string} params.owner
         * @param {string} params.repository
         * @returns {Promise}
         */
        buildHistory({ owner, repository }) {
            const def = Promise.defer();

            mozaik.logger.info(chalk.yellow(`[travis] calling buildHistory: ${owner}/${repository}`));

            travis.repos(owner, repository).builds.get((err, res) => {
                if (err) {
                    def.reject(err);
                }

                res.builds.forEach(build => {
                    const commit = _.find(res.commits, { id: build.commit_id });
                    if (commit) {
                        build.commit = commit;
                    }
                });

                def.resolve(res.builds);
            });

            return def.promise;
        }
    };
};


export default client;

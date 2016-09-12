import React, { Component, PropTypes } from 'react'; // eslint-disable-line no-unused-vars
import moment                          from 'moment';
import reactMixin                      from 'react-mixin';
import { ListenerMixin }               from 'reflux';
import Mozaik                          from 'mozaik/browser';


class BuildStatus extends Component {
    constructor(props) {
        super(props);
        this.state = { build: null };
    }

    getApiRequest() {
        const { owner, repository, branch } = this.props;

        return {
            id:     `travis.buildStatus.${owner}.${repository}.${branch}`,
            params: { owner, repository, branch }
        };
    }

    onApiData(build) {
        this.setState({ build });
    }

    render() {
        const { owner, repository, branch, title } = this.props;
        const { build } = this.state;

        let statusClasses;
        let iconClasses;
        let widgetBody;

        if (build != null) {
            const finalTitle = title || `${ owner } / ${ repository } / ${ branch }`;

            if (build.status === 'SUCCESS') {
                iconClasses = 'fa fa-check';
            }

            statusClasses = 'widget__body__colored ' +
                `travis__view__build__colored_status--${ build.status } ` +
                `travis__view__build__colored_status__previous--${ build.previous_status }`;
            const buildUrl = `https://travis-ci.org/${owner}/${repository}/builds/${build.id}`;

            widgetBody = (
                <div className="travis__build-status__current">
                    Build #{build.number}<br />
                    <a className="travis__build-status__current__status" href={buildUrl}>
                        {finalTitle}&nbsp;
                        <i className={iconClasses}/>
                    </a><br/>
                    <time className="travis__build-status__current__time">
                        <i className="fa fa-clock-o"/>&nbsp;
                        {moment(build.timestamp).fromNow()}
                    </time>
                </div>
            );
        }

        return (
            <div className={statusClasses}>
                {widgetBody}
            </div>
        );
    }
}

BuildStatus.displayName = 'BuildStatus';

BuildStatus.propTypes = {
    owner:      PropTypes.string.isRequired,
    repository: PropTypes.string.isRequired,
    branch:     PropTypes.string,
    title:      PropTypes.string
};

BuildStatus.defaultProps = {
    branch: 'master'
};

reactMixin(BuildStatus.prototype, ListenerMixin);
reactMixin(BuildStatus.prototype, Mozaik.Mixin.ApiConsumer);


export default BuildStatus;

/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
package org.graylog.datanode.process;

import org.apache.http.HttpHost;
import org.opensearch.client.RestClient;
import org.opensearch.client.RestClientBuilder;
import org.opensearch.client.RestHighLevelClient;

import java.nio.file.Path;

public class OpensearchProcess {
    private final String opensearchVersion;
    private final Path targetLocation;
    private final Process process;
    private final OpensearchProcessLogs processLogs;
    private final RestHighLevelClient restClient;
    private ProcessStatus status;

    public OpensearchProcess(String opensearchVersion, Path targetLocation, Process opensearchProcess, OpensearchProcessLogs processLogs) {
        this.opensearchVersion = opensearchVersion;
        this.targetLocation = targetLocation;
        this.process = opensearchProcess;
        this.processLogs = processLogs;
        this.status = ProcessStatus.STARTED;

        RestClientBuilder builder = RestClient.builder(new HttpHost("localhost", 9200, "http"));
        this.restClient = new RestHighLevelClient(builder);

    }

    public Process getProcess() {
        return process;
    }

    public String getOpensearchVersion() {
        return opensearchVersion;
    }

    public Path getTargetLocation() {
        return targetLocation;
    }

    public OpensearchProcessLogs getProcessLogs() {
        return processLogs;
    }

    public RestHighLevelClient getRestClient() {
        return restClient;
    }

    public ProcessStatus getStatus() {
        return status;
    }

    public ProcessInfo getProcessInfo() {
        return new ProcessInfo(
                process.pid(),
                status,
                process.info().startInstant().orElse(null),
                process.info().totalCpuDuration().orElse(null),
                process.info().user().orElse(null));
    }

    public void setStatus(ProcessStatus status) {
        this.status = status;
    }
}


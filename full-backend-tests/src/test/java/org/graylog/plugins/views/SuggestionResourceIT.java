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
package org.graylog.plugins.views;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.graylog.testing.completebackend.apis.GraylogApis;
import org.graylog.testing.completebackend.apis.Streams;
import org.graylog.testing.containermatrix.SearchServer;
import org.graylog.testing.containermatrix.annotations.ContainerMatrixTest;
import org.graylog.testing.containermatrix.annotations.ContainerMatrixTestsConfiguration;
import org.graylog2.plugin.streams.StreamRuleType;
import org.junit.jupiter.api.BeforeAll;

import javax.annotation.Nullable;
import java.util.Set;

import static io.restassured.RestAssured.given;
import static org.graylog.testing.completebackend.Lifecycle.VM;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.core.IsEqual.equalTo;

@ContainerMatrixTestsConfiguration(serverLifecycle = VM, searchVersions = {SearchServer.ES7, SearchServer.OS1, SearchServer.OS2, SearchServer.OS2_LATEST, SearchServer.DATANODE_DEV})
public class SuggestionResourceIT {
    private final GraylogApis api;

    private String stream1Id;
    private String stream2Id;

    public SuggestionResourceIT(GraylogApis api) {
        this.api = api;
    }

    record SuggestionsRequest(String field, String input,
                              @JsonInclude(JsonInclude.Include.NON_NULL) @Nullable Set<String> streams,
                              @JsonInclude(JsonInclude.Include.NON_NULL) @Nullable Integer size) {
        static SuggestionsRequest create(String field, String input) {
            return new SuggestionsRequest(field, input, null, null);
        }

        static SuggestionsRequest create(String field, String input, Set<String> streams) {
            return new SuggestionsRequest(field, input, streams, null);
        }

        static SuggestionsRequest create(String field, String input, int size) {
            return new SuggestionsRequest(field, input, null, size);
        }
    }

    @BeforeAll
    public void init() {
        final String defaultIndexSetId = api.indices().defaultIndexSetId();
        this.stream1Id = api.streams().createStream("Stream #1", defaultIndexSetId, new Streams.StreamRule(StreamRuleType.EXACT.toInteger(), "stream1", "target_stream", false));
        this.stream2Id = api.streams().createStream("Stream #2", defaultIndexSetId, new Streams.StreamRule(StreamRuleType.EXACT.toInteger(), "stream2", "target_stream", false));

        api.gelf().createGelfHttpInput()
                .postMessage(
                        """
                                {"short_message":"SuggestionResourceIT#1",
                                 "host":"example.org",
                                  "facility":"junit",
                                  "_target_stream": "stream1",
                                  "http_response_code": 200
                                  }""")
                .postMessage(
                        """
                                {"short_message":"SuggestionResourceIT#2",
                                 "host":"example.org",
                                  "facility":"test",
                                  "_target_stream": "stream1",
                                  "http_response_code": 200
                                  }""")
                .postMessage(
                        """
                                {"short_message":"SuggestionResourceIT#3",
                                "host":"example.org",
                                 "facility":"test",
                                  "_target_stream": "stream1",
                                  "http_response_code": 201
                                  }""")
                .postMessage(
                        """
                                {"short_message":"SuggestionResourceIT#4",
                                 "host":"foreign.org",
                                 "facility":"test",
                                 "_target_stream": "stream2",
                                 "http_response_code": 404
                                 }""")
                .postMessage(
                        """
                                {"short_message":"SuggestionResourceIT#5",
                                 "host":"something-else.org",
                                 "foo":"bar",
                                 }""");

        api.search().waitForMessages(
                "SuggestionResourceIT#1",
                "SuggestionResourceIT#2",
                "SuggestionResourceIT#3",
                "SuggestionResourceIT#4",
                "SuggestionResourceIT#5"
        );

        api.fieldTypes().waitForFieldTypeDefinitions("gl2_source_node", "gl2_source_input", "streams");
    }

    @ContainerMatrixTest
    void testMinimalRequest() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("facility", ""))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.value[0]", equalTo("test"))
                .body("suggestions.occurrence[0]", greaterThanOrEqualTo(3));
    }

    @ContainerMatrixTest
    void testNumericalValueSuggestion() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("http_response_code", "20"))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.value[0]", equalTo("200"))
                .body("suggestions.occurrence[0]", greaterThanOrEqualTo(2));
    }

    @ContainerMatrixTest
    void testAugmentedSuggestionTitlesForStreams() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("streams", ""))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.title", hasItems("Default Stream", "Stream #1", "Stream #2"));
    }

    @ContainerMatrixTest
    void testAugmentedSuggestionTitlesForNodes() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("gl2_source_node", ""))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.title", not(empty()));
    }

    @ContainerMatrixTest
    void testAugmentedSuggestionTitlesForInputs() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("gl2_source_input", ""))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.title", hasItems("Integration test GELF input"));
    }

    @ContainerMatrixTest
    void testSuggestionsAreLimitedToStream() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("source", "", Set.of(stream1Id)))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.value[0]", equalTo("example.org"))
                .body("suggestions.occurrence[0]", equalTo(3));

        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("source", "", Set.of(stream2Id)))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.value[0]", equalTo("foreign.org"))
                .body("suggestions.occurrence[0]", equalTo(1));
    }

    @ContainerMatrixTest
    void testInvalidField() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("message", "foo"))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                // error types and messages are different for each ES version, so let's just check that there is an error in the response
                .body("error", notNullValue());
    }

    @ContainerMatrixTest
    void testSizeOtherDocsCount() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("facility", "", 1))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.value[0]", equalTo("test"))
                .body("suggestions.occurrence[0]", greaterThanOrEqualTo(2))
                .body("sum_other_docs_count", greaterThanOrEqualTo(1));
    }

    @ContainerMatrixTest
    void testTypoCorrection() {
        given()
                .spec(api.requestSpecification())
                .when()
                .body(SuggestionsRequest.create("facility", "tets"))
                .post("/search/suggest")
                .then()
                .statusCode(200)
                .assertThat().log().ifValidationFails()
                .body("suggestions.value[0]", equalTo("test"))
                .body("suggestions.occurrence[0]", greaterThanOrEqualTo(1));
    }

}

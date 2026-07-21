package com.neetaspirants.api.web;

import com.neetaspirants.api.dto.ForumDtos.PostSummaryDto;
import com.neetaspirants.api.service.SearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public List<PostSummaryDto> search(
            @RequestParam String q,
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        return searchService.search(q, limit);
    }
}
